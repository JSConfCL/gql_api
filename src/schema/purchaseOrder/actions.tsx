import { and, eq, lt } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { AsyncReturnType } from "type-fest";

import { ORM_TYPE } from "~/datasources/db";
import {
  USER,
  puchaseOrderPaymentStatusEnum,
  purchaseOrderStatusEnum,
  purchaseOrdersSchema,
  selectPurchaseOrdersSchema,
  selectTicketSchema,
  selectUserTicketsSchema,
} from "~/datasources/db/schema";
import {
  createMercadoPagoPayment,
  getMercadoPagoPayment,
} from "~/datasources/mercadopago";
import {
  createStripePayment,
  getStripePaymentStatus,
} from "~/datasources/stripe";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";
import { ensureProductsAreCreated } from "~/schema/ticket/helpers";
import { Context } from "~/types";

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

const sendConfirmationEmail = async ({
  transactionalEmailService,
  logger,
  DB,
  purchaseOrderId,
  email,
}: {
  DB: ORM_TYPE;
  transactionalEmailService: Context["RPC_SERVICE_EMAIL"];
  logger: Logger;
  purchaseOrderId: string;
  email: string;
}) => {
  const information = await DB.query.purchaseOrdersSchema.findFirst({
    where: (po, { eq }) => eq(po.id, purchaseOrderId),
    with: {
      user: true,
      userTickets: {
        with: {
          ticketTemplate: {
            with: {
              event: {
                with: {
                  eventsToCommunities: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const eventInfo = information?.userTickets?.[0]?.ticketTemplate?.event;

  if (!eventInfo) {
    throw applicationError(
      "Event not found",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  const eventsToCommunities = eventInfo?.eventsToCommunities[0];

  if (!eventsToCommunities) {
    throw applicationError(
      "Community relationship not found",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  const communityId = eventsToCommunities?.communityId;
  const communityInfo = await DB.query.communitySchema.findFirst({
    where: (c, { eq }) => eq(c.id, communityId),
  });

  if (!communityInfo) {
    throw applicationError(
      "Community not found",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  await transactionalEmailService.sendPurchaseOrderSuccessful({
    purchaseOrderId,
    purchaseOrder: {
      user: {
        name: information?.user?.name,
        username: information?.user?.username,
        email: information?.user?.email,
      },
    },
    communityInfo: {
      name: communityInfo.name,
      logoImageSanityRef: communityInfo.logoImageSanityRef,
    },
    eventInfo: {
      name: eventInfo.name,
      addressDescriptiveName: eventInfo.addressDescriptiveName,
      address: eventInfo.address,
      startDateTime: eventInfo.startDateTime,
      endDateTime: eventInfo.endDateTime,
    },
  });

  logger.info(`Email sent to ${email}`);
};

const createMercadoPagoPaymentIntent = async ({
  query,
  userTickets,
  purchaseOrderId,
  USER,
  paymentSuccessRedirectURL,
  paymentCancelRedirectURL,
  GET_MERCADOPAGO_CLIENT,
  logger,
}: {
  query: AsyncReturnType<typeof fetchPurchaseOrderInformation>;
  userTickets: Array<
    typeof selectUserTicketsSchema._type & {
      ticketTemplate: typeof selectTicketSchema._type;
    }
  >;
  purchaseOrderId: string;
  GET_MERCADOPAGO_CLIENT: Context["GET_MERCADOPAGO_CLIENT"];
  paymentSuccessRedirectURL: string;
  paymentCancelRedirectURL: string;
  USER: {
    email: string;
    id: string;
  };
  logger: Logger;
}) => {
  const pricesInCLP: Record<string, number | undefined> = {};

  for (const ticket of query) {
    if (!ticket.ticketTemplate.isFree) {
      for (const ticketPrice of ticket.ticketTemplate.ticketsPrices) {
        pricesInCLP[ticket.id] = ticketPrice.price.price_in_cents;
      }
    } else {
      pricesInCLP[ticket.id] = 0;
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

  logger.info("userTickets", userTickets);

  for (const ticket of userTickets) {
    if (!ticketsGroupedByTemplateId[ticket.ticketTemplate.id]) {
      const unitPrice = pricesInCLP[ticket.id];

      if (unitPrice !== 0 && !unitPrice) {
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
    paymentSuccessRedirectURL,
    paymentCancelRedirectURL,
  });
};

const createStripePaymentIntent = async ({
  purchaseOrderId,
  GET_STRIPE_CLIENT,
  userTickets,
  paymentSuccessRedirectURL,
  paymentCancelRedirectURL,
  logger,
}: {
  userTickets: Array<
    typeof selectUserTicketsSchema._type & {
      ticketTemplate: typeof selectTicketSchema._type;
    }
  >;
  purchaseOrderId: string;
  GET_STRIPE_CLIENT: Context["GET_STRIPE_CLIENT"];
  paymentSuccessRedirectURL: string;
  paymentCancelRedirectURL: string;
  logger: Logger;
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

  logger.info("Attempting to create payment on platform", {
    items,
    purchaseOrderId,
  });
  // 2. We create a payment link on stripe.
  const paymentLink = await createStripePayment({
    items,
    purchaseOrderId,
    getStripeClient: GET_STRIPE_CLIENT,
    paymentSuccessRedirectURL,
    paymentCancelRedirectURL,
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
  paymentSuccessRedirectURL,
  paymentCancelRedirectURL,
  logger,
  transactionalEmailService,
}: {
  DB: Context["DB"];
  purchaseOrderId: string;
  USER: USER;
  GET_STRIPE_CLIENT: Context["GET_STRIPE_CLIENT"];
  GET_MERCADOPAGO_CLIENT: Context["GET_MERCADOPAGO_CLIENT"];
  paymentSuccessRedirectURL: string;
  paymentCancelRedirectURL: string;
  currencyId: string;
  logger: Logger;
  transactionalEmailService: Context["RPC_SERVICE_EMAIL"];
}) => {
  if (!USER) {
    throw new GraphQLError("No autorizado");
  }

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

  if (!purchaseOrder) {
    throw new GraphQLError("Orden de compra no encontrada");
  }

  if (purchaseOrder?.userId !== USER.id) {
    throw new GraphQLError("No authorizado");
  }

  if (!currencyCode) {
    throw new GraphQLError("No encontramos un currency con ese ID");
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

    logger.info(
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

    const userTickets = await DB.query.userTicketsSchema.findMany({
      where: (t, { eq }) => eq(t.purchaseOrderId, purchaseOrderId),
    });

    const userTicketsIds = userTickets.map((t) => t.id);

    await sendConfirmationEmail({
      DB,
      transactionalEmailService,
      logger,
      purchaseOrderId,
      email: USER.email,
    });

    return {
      purchaseOrder: selectPurchaseOrdersSchema.parse(updatedPO),
      ticketsIds: userTicketsIds,
    };
    // TODO: Update purchase order to "auto-pay" or not be required.
  }

  // We only need to do this for USD, as we are using Stripe for USD payments.
  if (currencyCode === "USD") {
    await DB.transaction(async (trx) => {
      logger.info("Purchase order requires payment");

      // 1. We ensure that products are created in the database.
      for (const ticket of query) {
        for (const ticketPrice of ticket.ticketTemplate.ticketsPrices) {
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
              logger,
            });
          } catch (error) {
            logger.error("Could not create product", error);
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
  let paymentPlatformExpirationDate: Date | undefined = undefined;

  if (currencyCode === "USD") {
    const paymentLink = await createStripePaymentIntent({
      userTickets,
      purchaseOrderId,
      GET_STRIPE_CLIENT,
      paymentSuccessRedirectURL,
      paymentCancelRedirectURL,
      logger,
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

    paymentPlatformExpirationDate = new Date(paymentLink.expires_at);
  } else if (currencyCode === "CLP") {
    const { preference, expirationDate } = await createMercadoPagoPaymentIntent(
      {
        query,
        userTickets,
        purchaseOrderId,
        USER,
        paymentSuccessRedirectURL,
        paymentCancelRedirectURL,
        GET_MERCADOPAGO_CLIENT,
        logger,
      },
    );

    paymentPlatform = "mercadopago";

    paymentPlatformPaymentLink = preference.init_point;

    paymentPlatformReferenceID = preference.id;

    paymentPlatformStatus = "none";

    paymentPlatformExpirationDate = new Date(expirationDate);
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
      currencyId,
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
  GET_MERCADOPAGO_CLIENT,
  logger,
}: {
  DB: Context["DB"];
  purchaseOrderId: string;
  GET_STRIPE_CLIENT: Context["GET_STRIPE_CLIENT"];
  GET_MERCADOPAGO_CLIENT: Context["GET_MERCADOPAGO_CLIENT"];
  logger: Logger;
}) => {
  logger.info("Finding purchase order:", purchaseOrderId);
  const purchaseOrder = await DB.query.purchaseOrdersSchema.findFirst({
    where: (po, { eq, isNotNull }) =>
      and(eq(po.id, purchaseOrderId), isNotNull(po.paymentPlatformReferenceID)),
  });

  if (!purchaseOrder) {
    throw new Error("OC No encontrada");
  }

  const { paymentPlatformReferenceID } = purchaseOrder;

  logger.info("Payment platform reference id:", paymentPlatformReferenceID);

  if (!paymentPlatformReferenceID) {
    throw new Error(
      `No se ha inicializado un pago para la OC ${purchaseOrderId}`,
    );
  }

  let poPaymentStatus: (typeof puchaseOrderPaymentStatusEnum)[number] =
    purchaseOrder.purchaseOrderPaymentStatus;
  let poStatus: (typeof purchaseOrderStatusEnum)[number] = purchaseOrder.status;
  let totalPrice = purchaseOrder.totalPrice;

  if (purchaseOrder.paymentPlatform === "stripe") {
    const stripeStatus = await getStripePaymentStatus({
      paymentId: paymentPlatformReferenceID,
      getStripeClient: GET_STRIPE_CLIENT,
    });

    poPaymentStatus = stripeStatus.paymentStatus;

    poStatus = stripeStatus.status ?? poStatus;
  }

  if (purchaseOrder.paymentPlatform === "mercadopago") {
    const mercadoPagoStatus = await getMercadoPagoPayment({
      purchaseOrderId: purchaseOrder.id,
      getMercadoPagoClient: GET_MERCADOPAGO_CLIENT,
    });

    poPaymentStatus = mercadoPagoStatus.paymentStatus;

    poStatus = mercadoPagoStatus.status ?? poStatus;

    totalPrice = mercadoPagoStatus.totalPaidAmount?.toString() ?? totalPrice;
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
        totalPrice: totalPrice,
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

export const clearExpiredPurchaseOrders = async ({
  DB,
}: {
  DB: Context["DB"];
}) => {
  const currentDateonISO = new Date();
  // Actualiza todas las OCs que no se han pagado y su tiempo de expiración venció.
  const expiredOrders = await DB.update(purchaseOrdersSchema)
    .set({
      status: "expired",
    })
    .where(
      and(
        eq(purchaseOrdersSchema.purchaseOrderPaymentStatus, "unpaid"),
        eq(purchaseOrdersSchema.status, "open"),
        lt(
          purchaseOrdersSchema.paymentPlatformExpirationDate,
          currentDateonISO,
        ),
      ),
    )
    .returning();

  return expiredOrders;
};
