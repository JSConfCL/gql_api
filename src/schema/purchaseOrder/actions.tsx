import { render } from "@react-email/components";
import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import React from "react";
import { AsyncReturnType } from "type-fest";

import { PurchaseOrderSuccessful } from "emails/templates/tickets/purchase-order-successful";
import { Context } from "~/builder";
import { ORM_TYPE } from "~/datasources/db";
import {
  puchaseOrderPaymentStatusEnum,
  purchaseOrderStatusEnum,
  purchaseOrdersSchema,
  selectPurchaseOrdersSchema,
  selectTicketSchema,
  selectUserTicketsSchema,
  userTicketsSchema,
} from "~/datasources/db/schema";
import { sendTransactionalHTMLEmail } from "~/datasources/email/sendEmailToWorkers";
import {
  createStripePayment,
  getStripePaymentStatus,
} from "~/datasources/stripe";
import { ensureProductsAreCreated } from "~/schema/ticket/helpers";

import { createMercadoPagoPayment } from "../../datasources/mercadopago";

const fetchPurchaseOrderInformation = async (
  purchaseOrderId: string,
  DB: ORM_TYPE,
) => {
  return await DB.query.userTicketsSchema.findMany({
    where: (t, { eq }) => eq(t.purchaseOrderId, purchaseOrderId),
    with: {
      ticketTemplate: {
        with: {
          ticketsPrices: {
            with: {
              price: {
                with: {
                  currency: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

const createMercadoPagoPaymentIntent = async ({
  query,
  userTickets,
  purchaseOrderId,
  USER,
  PURCHASE_CALLBACK_URL,
  GET_MERCADOPAGO_CLIENT,
}: {
  query: AsyncReturnType<typeof fetchPurchaseOrderInformation>;
  userTickets: Array<
    typeof selectUserTicketsSchema._type & {
      ticketTemplate: typeof selectTicketSchema._type;
    }
  >;
  purchaseOrderId: string;
  GET_MERCADOPAGO_CLIENT: Context["GET_MERCADOPAGO_CLIENT"];
  PURCHASE_CALLBACK_URL: string;
  USER: {
    email: string;
    id: string;
  };
}) => {
  const pricesInCLP: Record<string, number | undefined> = {};
  for (const ticket of query) {
    for (const ticketPrice of ticket.ticketTemplate.ticketsPrices) {
      if (ticketPrice.price.currency?.currency === "CLP") {
        pricesInCLP[ticket.id] = ticketPrice.price.price_in_cents;
      }
    }
  }

  const ticketsGroupedByTemplateId: Record<
    string,
    {
      title: string;
      quantity: number;
      unit_price: number;
    }
  > = {};
  for (const ticket of userTickets) {
    if (!ticketsGroupedByTemplateId[ticket.ticketTemplate.id]) {
      const unitPrice = pricesInCLP[ticket.id];
      if (!unitPrice) {
        throw new Error(`Unit price not found for ticket ${ticket.id}`);
      }
      ticketsGroupedByTemplateId[ticket.ticketTemplate.id] = {
        title: ticket.ticketTemplate.name,
        quantity: 0,
        unit_price: unitPrice,
      };
    }
    ticketsGroupedByTemplateId[ticket.ticketTemplate.id].quantity += 1;
  }
  return await createMercadoPagoPayment({
    eventId: "event-id",
    getMercadoPagoClient: GET_MERCADOPAGO_CLIENT,
    items: Object.entries(ticketsGroupedByTemplateId).map(([id, value]) => ({
      id,
      unit_price: value.unit_price,
      title: value.title,
      quantity: value.quantity,
    })),
    purchaseOrderId,
    user: {
      email: USER.email,
      id: USER.id,
    },
    PURCHASE_CALLBACK_URL,
  });
};

const createStripePaymentIntent = async ({
  purchaseOrderId,
  GET_STRIPE_CLIENT,
  userTickets,
  PURCHASE_CALLBACK_URL,
}: {
  userTickets: Array<
    typeof selectUserTicketsSchema._type & {
      ticketTemplate: typeof selectTicketSchema._type;
    }
  >;
  purchaseOrderId: string;
  GET_STRIPE_CLIENT: Context["GET_STRIPE_CLIENT"];
  PURCHASE_CALLBACK_URL: string;
}) => {
  const ticketsGroupedByTemplateId: Record<
    string,
    {
      templateId: string;
      quantity: number;
      stripeId: string | null;
    }
  > = {};

  for (const ticket of userTickets) {
    if (!ticketsGroupedByTemplateId[ticket.ticketTemplate.id]) {
      ticketsGroupedByTemplateId[ticket.ticketTemplate.id] = {
        templateId: ticket.ticketTemplate.id,
        quantity: 0,
        stripeId: ticket.ticketTemplate.stripeProductId,
      };
    }
    ticketsGroupedByTemplateId[ticket.ticketTemplate.id].quantity += 1;
  }
  const items: Array<{ price: string; quantity: number }> = [];
  for (const ticketGroup of Object.values(ticketsGroupedByTemplateId)) {
    if (!ticketGroup.stripeId) {
      throw new Error(
        `Stripe Product ID not found for ticket ${ticketGroup.templateId}`,
      );
    }
    items.push({
      price: ticketGroup.stripeId,
      quantity: ticketGroup.quantity,
    });
  }

  console.log("🚨 Attempting to create payment on platform");
  console.log(items, purchaseOrderId);
  // 2. We create a payment link on stripe.
  const paymentLink = await createStripePayment({
    items,
    purchaseOrderId,
    getStripeClient: GET_STRIPE_CLIENT,
    PURCHASE_CALLBACK_URL,
  });
  return paymentLink;
};
export const createPaymentIntent = async ({
  DB,
  USER,
  purchaseOrderId,
  currencyId,
  GET_MERCADOPAGO_CLIENT,
  GET_STRIPE_CLIENT,
  PURCHASE_CALLBACK_URL,
}: {
  DB: Context["DB"];
  purchaseOrderId: string;
  USER: Context["USER"];
  GET_STRIPE_CLIENT: Context["GET_STRIPE_CLIENT"];
  GET_MERCADOPAGO_CLIENT: Context["GET_MERCADOPAGO_CLIENT"];
  PURCHASE_CALLBACK_URL: string;
  currencyId: string;
}) => {
  const purchaseOrder = await DB.query.purchaseOrdersSchema.findFirst({
    where: (po, { eq, and }) =>
      and(eq(po.id, purchaseOrderId), eq(po.userId, USER.id)),
    with: {
      user: true,
    },
  });

  const currency = await DB.query.allowedCurrencySchema.findFirst({
    where: (c, { eq }) => eq(c.id, currencyId),
  });
  const currencyCode = currency?.currency;
  if (purchaseOrder?.userId !== USER.id) {
    throw new GraphQLError("No authorizado");
  }
  if (!currencyCode) {
    throw new GraphQLError("No encontramos un currency con ese ID");
  }
  if (!purchaseOrder) {
    throw new GraphQLError("Orden de compra no encontrada");
  }
  if (purchaseOrder.purchaseOrderPaymentStatus === "paid") {
    throw new GraphQLError("Orden de compra ya pagada");
  }
  if (purchaseOrder.purchaseOrderPaymentStatus === "not_required") {
    throw new GraphQLError("Pago no requerido");
  }

  // TODO: Depending on the currency ID, we update the totalPrice for the
  // purchase order.
  const query = await fetchPurchaseOrderInformation(purchaseOrderId, DB);

  let totalAmount = 0;
  let allTicketsAreFree = true;
  for (const ticket of query) {
    if (!ticket.ticketTemplate.isFree) {
      allTicketsAreFree = false;
    }
    for (const ticketPrice of ticket.ticketTemplate.ticketsPrices) {
      totalAmount = ticketPrice.price.price_in_cents ?? 0;
    }
  }

  if (!allTicketsAreFree && totalAmount === 0) {
    throw new GraphQLError(
      "Purchase order payment required, but total amount is zero. This should not happen",
    );
  }
  if (allTicketsAreFree) {
    if (totalAmount !== 0) {
      throw new GraphQLError(
        "Purchase order payment not required, but total amount is not zero. This should not happen",
      );
    }
    console.log(
      "Purchase order payment not required, meaning all tickets are free, updating purchase order to reflect that",
    );
    const updatedPOs = await DB.update(purchaseOrdersSchema)
      .set({
        purchaseOrderPaymentStatus: "not_required",
      })
      .where(eq(purchaseOrdersSchema.id, purchaseOrderId))
      .returning();
    const updatedPO = updatedPOs[0];
    if (!updatedPO) {
      throw new GraphQLError("Purchase order not found");
    }
    await DB.update(userTicketsSchema).set({
      paymentStatus: "not_required",
    });

    const userTickets = await DB.query.userTicketsSchema.findMany({
      where: (t, { eq }) => eq(t.purchaseOrderId, purchaseOrderId),
    });

    const userTicketsIds = userTickets.map((t) => t.id);

    const information = await DB.query.purchaseOrdersSchema.findFirst({
      where: (po, { eq }) => eq(po.id, purchaseOrderId),
      with: {
        user: true,
        userTickets: {
          with: {
            event: {
              with: {
                eventsToCommunities: {
                  with: {
                    community: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const eventInfo = information?.userTickets[0].event;
    if (!eventInfo) {
      console.error("Event not found");
    }
    const communityInfo = eventInfo?.eventsToCommunities[0].community;
    if (!communityInfo) {
      console.error("Community not found");
    }
    if (communityInfo && eventInfo) {
      await sendTransactionalHTMLEmail({
        htmlContent: render(
          <PurchaseOrderSuccessful
            purchaseOrderId={purchaseOrderId}
            community={{
              name: communityInfo.name,
              // communityURL: "https://cdn.com",
              logoURL: communityInfo.logoImageSanityRef,
            }}
            eventName={eventInfo.name}
            place={{
              name: eventInfo.addressDescriptiveName,
              address: eventInfo.address,
            }}
            date={{
              start: eventInfo.startDateTime,
              end: eventInfo.endDateTime,
            }}
          />,
        ),
        to: [
          {
            name: purchaseOrder.user.name ?? purchaseOrder.user.username,
            email: purchaseOrder.user.email,
          },
        ],
        from: {
          name: "CommunityOS",
        },
        subject: "Tus tickets están listos 🎉",
      });
    }

    console.log(`Email sent to ${purchaseOrder.user.email}`);
    return {
      purchaseOrder: selectPurchaseOrdersSchema.parse(updatedPO),
      ticketsIds: userTicketsIds,
    };
    // TODO: Update purchase order to "auto-pay" or not be required.
  }

  // We only need to do this for USD, as we are using Stripe for USD payments.
  if (currencyCode === "USD") {
    await DB.transaction(async (trx) => {
      console.log("Purchase order requires payment");
      // 1. We ensure that products are created in the database.
      for (const ticket of query) {
        for (const ticketPrice of ticket.ticketTemplate.ticketsPrices) {
          console.log("🚨", ticketPrice.price.price_in_cents);
          if (!ticketPrice.price.currency) {
            throw new Error(
              `Currency no encontrada para ticket ${ticket.id}, ticketPrice ${ticketPrice.id}`,
            );
          }
          try {
            await ensureProductsAreCreated({
              price: ticketPrice.price.price_in_cents,
              currencyCode: ticketPrice.price.currency.currency,
              ticket: ticket.ticketTemplate,
              getStripeClient: GET_STRIPE_CLIENT,
              transactionHander: trx,
            });
          } catch (error) {
            console.error("Could not create product", error);
          }
        }
      }
    });
  }

  const userTickets = await DB.query.userTicketsSchema.findMany({
    where: (t, { eq }) => eq(t.purchaseOrderId, purchaseOrderId),
    with: {
      ticketTemplate: true,
    },
  });

  let totalPrice: string | undefined = undefined;
  let paymentPlatform: "mercadopago" | "stripe" | undefined = undefined;
  let paymentPlatformPaymentLink: string | undefined | null = undefined;
  let paymentPlatformReferenceID: string | undefined = undefined;
  let paymentPlatformStatus: string | undefined | null = undefined;
  let paymentPlatformExpirationDate: string | undefined = undefined;

  if (currencyCode === "USD") {
    const paymentLink = await createStripePaymentIntent({
      userTickets,
      purchaseOrderId,
      GET_STRIPE_CLIENT,
      PURCHASE_CALLBACK_URL,
    });
    // 3. We update the purchase order with the payment link, and the total
    //    price and status
    if (!paymentLink.amount_total) {
      throw new Error("Amount total not found");
    }
    paymentPlatform = "stripe";
    totalPrice = paymentLink.amount_total.toString();
    paymentPlatformPaymentLink = paymentLink.url;
    paymentPlatformReferenceID = paymentLink.id;
    paymentPlatformStatus = paymentLink.status;
    paymentPlatformExpirationDate = new Date(
      paymentLink.expires_at,
    ).toISOString();
  } else if (currencyCode === "CLP") {
    const { preference, expirationDate } = await createMercadoPagoPaymentIntent(
      {
        query,
        userTickets,
        purchaseOrderId,
        USER,
        PURCHASE_CALLBACK_URL,
        GET_MERCADOPAGO_CLIENT,
      },
    );
    paymentPlatform = "mercadopago";
    paymentPlatformPaymentLink = preference.init_point;
    paymentPlatformReferenceID = preference.id;
    paymentPlatformStatus = "none";
    paymentPlatformExpirationDate = expirationDate;
  }
  const updatedPurchaseOrders = await DB.update(purchaseOrdersSchema)
    .set({
      totalPrice,
      paymentPlatform,
      paymentPlatformPaymentLink,
      paymentPlatformReferenceID,
      paymentPlatformStatus,
      paymentPlatformExpirationDate,
      purchaseOrderPaymentStatus: "unpaid",
    })
    .where(eq(purchaseOrdersSchema.id, purchaseOrderId))
    .returning();
  const updatedPurchaseOrder = updatedPurchaseOrders[0];

  if (!updatedPurchaseOrder) {
    throw new Error("Purchase order not found");
  }

  return {
    purchaseOrder: selectPurchaseOrdersSchema.parse(updatedPurchaseOrder),
    ticketsIds: userTickets.map((t) => t.id),
  };
};

export const syncPurchaseOrderPaymentStatus = async ({
  DB,
  purchaseOrderId,
  GET_STRIPE_CLIENT,
}: {
  DB: Context["DB"];
  purchaseOrderId: string;
  GET_STRIPE_CLIENT: Context["GET_STRIPE_CLIENT"];
}) => {
  const purchaseOrder = await DB.query.purchaseOrdersSchema.findFirst({
    where: (po, { eq }) => eq(po.id, purchaseOrderId),
  });

  if (!purchaseOrder) {
    throw new Error("OC No encontrada");
  }

  const { paymentPlatformReferenceID } = purchaseOrder;
  if (!paymentPlatformReferenceID) {
    throw new Error("No se ha inicializado un pago para esta OC");
  }
  let poPaymentStatus: (typeof puchaseOrderPaymentStatusEnum)[number] =
    purchaseOrder.purchaseOrderPaymentStatus;
  let poStatus: (typeof purchaseOrderStatusEnum)[number] = purchaseOrder.status;
  if (purchaseOrder.paymentPlatform === "stripe") {
    const stripeStatus = await getStripePaymentStatus({
      paymentId: paymentPlatformReferenceID,
      getStripeClient: GET_STRIPE_CLIENT,
    });
    poPaymentStatus = stripeStatus.paymentStatus;
    poStatus = stripeStatus.status ?? poStatus;
  }
  if (purchaseOrder.paymentPlatform === "mercadopago") {
    // TODO: Implement MercadoPago payment status
  }

  if (
    poPaymentStatus !== purchaseOrder.purchaseOrderPaymentStatus ||
    poStatus !== purchaseOrder.status
  ) {
    // we update the purchase order with the new status, only if they are different from the current status
    const updatedPurchaseOrder = await DB.update(purchaseOrdersSchema)
      .set({
        purchaseOrderPaymentStatus: poPaymentStatus,
        status: poStatus,
      })
      .where(eq(purchaseOrdersSchema.id, purchaseOrderId))
      .returning();
    const updatedPO = updatedPurchaseOrder[0];
    if (!updatedPO) {
      throw new Error("OC no encontrada");
    }
    return updatedPO;
  }
  return purchaseOrder;
};
