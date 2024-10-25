import { and, eq, inArray, lt } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { ORM_TYPE } from "~/datasources/db";
import {
  InsertUserTicketTransferSchema,
  USER,
  PurchaseOrderPaymentPlatform,
  PurchaseOrderPaymentStatus,
  PurchaseOrderStatus,
  purchaseOrdersSchema,
  selectPurchaseOrdersSchema,
  SelectUserTicketSchema,
  SelectTicketSchema,
  userTicketTransfersSchema,
  userTicketsSchema,
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
import { Context } from "~/types";

import { ensureProductsAreCreated } from "../ticket/helpers";
import { getExpirationDateForTicketTransfer } from "../userTicketsTransfers/helpers";

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

type SendPurchaseOrderSuccessfulEmailArgs = {
  transactionalEmailService: Context["RPC_SERVICE_EMAIL"];
  logger: Logger;
  purchaseOrder: {
    id: string;
    user: {
      id: string;
      name: string | null;
      username: string;
      email: string;
    };
    totalPrice: string | null;
    currency: {
      currency: string;
    } | null;
    userTickets: Array<{
      publicId: string;
      ticketTemplate: {
        tags: string[];
        event: {
          name: string;
          addressDescriptiveName: string | null;
          address: string | null;
          startDateTime: Date;
          endDateTime: Date | null;
          logoImageReference: {
            url: string;
          } | null;
          eventsToCommunities: Array<{
            community: {
              slug: string | null;
              name: string;
              logoImageSanityRef: string | null;
            };
          }>;
        };
      };
    }>;
  };
};

const sendPurchaseOrderSuccessfulEmail = async ({
  transactionalEmailService,
  logger,
  purchaseOrder,
}: SendPurchaseOrderSuccessfulEmailArgs) => {
  const firstEventInfo = purchaseOrder.userTickets[0]?.ticketTemplate?.event;

  if (!firstEventInfo) {
    throw applicationError(
      "Event not found",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  const firstCommunityInfo = firstEventInfo.eventsToCommunities[0].community;

  if (!firstCommunityInfo) {
    throw applicationError(
      "Community relationship not found",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  await transactionalEmailService.sendPurchaseOrderSuccessful({
    purchaseOrder: {
      id: purchaseOrder.id,
      user: {
        id: purchaseOrder.user.id,
        name: purchaseOrder.user.name,
        username: purchaseOrder.user.username,
        email: purchaseOrder.user.email,
      },
      currencyCode: purchaseOrder.currency?.currency,
      totalPrice: purchaseOrder.totalPrice,
      userTickets: purchaseOrder.userTickets,
    },
    communityInfo: {
      slug: firstCommunityInfo.slug,
      name: firstCommunityInfo.name,
      logoImageSanityRef: firstCommunityInfo.logoImageSanityRef,
    },
    eventInfo: {
      name: firstEventInfo.name,
      addressDescriptiveName: firstEventInfo.addressDescriptiveName,
      address: firstEventInfo.address,
      startDateTime: firstEventInfo.startDateTime,
      endDateTime: firstEventInfo.endDateTime,
      eventLogoCloudflareImageURL: firstEventInfo.logoImageReference?.url,
    },
  });

  logger.info(`Email sent to ${purchaseOrder.user.email}`);
};

const createMercadoPagoPaymentIntent = async ({
  userTickets,
  purchaseOrderId,
  USER,
  paymentSuccessRedirectURL,
  paymentCancelRedirectURL,
  GET_MERCADOPAGO_CLIENT,
  logger,
}: {
  userTickets: Array<
    SelectUserTicketSchema & {
      ticketTemplate: {
        id: string;
        name: string;
        isFree: boolean;
        price: {
          amount: number;
        } | null;
      };
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
}): Promise<PaymentPlatformIntent> => {
  const ticketsGroupedByTemplateId: Record<
    string,
    {
      title: string;
      quantity: number;
      unit_price: number;
    }
  > = {};

  for (const ticket of userTickets) {
    if (ticket.ticketTemplate.isFree) {
      continue;
    }

    if (!ticket.ticketTemplate.price) {
      throw new Error(
        `Ticket ${ticket.ticketTemplate.id} does not have a price`,
      );
    }

    if (!ticketsGroupedByTemplateId[ticket.ticketTemplate.id]) {
      ticketsGroupedByTemplateId[ticket.ticketTemplate.id] = {
        title: ticket.ticketTemplate.name,
        quantity: 0,
        unit_price: ticket.ticketTemplate.price.amount,
      };
    }

    ticketsGroupedByTemplateId[ticket.ticketTemplate.id].quantity += 1;
  }

  const totalPrice = Object.values(ticketsGroupedByTemplateId).reduce(
    (acc, ticket) => acc + ticket.unit_price * ticket.quantity,
    0,
  );

  const { preference, expirationDate } = await createMercadoPagoPayment({
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

  logger.info("MercadoPago payment created", {
    preference,
    expirationDate,
  });

  if (!preference.init_point) {
    throw new Error("MercadoPago payment link not found");
  }

  if (!preference.id) {
    throw new Error("MercadoPago payment reference ID not found");
  }

  return {
    paymentPlatform: "mercadopago",
    paymentPlatformPaymentLink: preference.init_point,
    paymentPlatformReferenceID: preference.id,
    paymentPlatformStatus: "none",
    paymentPlatformExpirationDate: new Date(expirationDate),
    totalPrice: totalPrice.toString(),
  };
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
    SelectUserTicketSchema & {
      ticketTemplate: Pick<
        SelectTicketSchema,
        "id" | "stripeProductId" | "isFree"
      >;
    }
  >;
  purchaseOrderId: string;
  GET_STRIPE_CLIENT: Context["GET_STRIPE_CLIENT"];
  paymentSuccessRedirectURL: string;
  paymentCancelRedirectURL: string;
  logger: Logger;
}): Promise<PaymentPlatformIntent> => {
  const ticketsGroupedByTemplateId: Record<
    string,
    {
      templateId: string;
      quantity: number;
      stripeId: string;
    }
  > = {};

  for (const ticket of userTickets) {
    if (ticket.ticketTemplate.isFree) {
      continue;
    }

    if (!ticket.ticketTemplate.stripeProductId) {
      throw new Error(
        `Stripe product not found for ticket ${ticket.ticketTemplate.id}`,
      );
    }

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
    items.push({
      price: ticketGroup.stripeId,
      quantity: ticketGroup.quantity,
    });
  }

  logger.info("Attempting to create payment on Stripe", {
    items,
    purchaseOrderId,
  });

  const paymentLink = await createStripePayment({
    items,
    purchaseOrderId,
    getStripeClient: GET_STRIPE_CLIENT,
    paymentSuccessRedirectURL,
    paymentCancelRedirectURL,
  });

  if (!paymentLink.amount_total) {
    throw new Error("Amount total not found");
  }

  if (!paymentLink.id) {
    throw new Error("Stripe payment reference ID not found");
  }

  if (!paymentLink.url) {
    throw new Error("Stripe payment link not found");
  }

  if (!paymentLink.status) {
    throw new Error("Stripe payment status not found");
  }

  return {
    paymentPlatform: "stripe",
    paymentPlatformPaymentLink: paymentLink.url,
    paymentPlatformReferenceID: paymentLink.id,
    paymentPlatformStatus: paymentLink.status,
    paymentPlatformExpirationDate: new Date(paymentLink.expires_at),
    totalPrice: paymentLink.amount_total.toString(),
  };
};

export const handlePaymentLinkGeneration = async ({
  DB,
  USER,
  purchaseOrderId,
  currencyId,
  GET_MERCADOPAGO_CLIENT,
  GET_STRIPE_CLIENT,
  paymentSuccessRedirectURL,
  paymentCancelRedirectURL,
  logger,
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

  if (!purchaseOrder) {
    throw new GraphQLError("Orden de compra no encontrada");
  }

  if (purchaseOrder.userId !== USER.id) {
    throw new GraphQLError("No autorizado");
  }

  if (!currency) {
    throw new GraphQLError(
      `No encontramos un currency con el id ${currencyId}`,
    );
  }

  if (purchaseOrder.purchaseOrderPaymentStatus === "paid") {
    throw new GraphQLError("Orden de compra ya pagada");
  }

  if (purchaseOrder.purchaseOrderPaymentStatus === "not_required") {
    throw new GraphQLError("Pago no requerido");
  }

  const purchaseOrderInfo = await fetchPurchaseOrderInformation(
    purchaseOrderId,
    DB,
  );

  const { totalAmount, allTicketsAreFree: allTicketsAreFree } =
    calculateTotalAmount(purchaseOrderInfo, currencyId);

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
        status: "complete",
        purchaseOrderPaymentStatus: "not_required",
      })
      .where(eq(purchaseOrdersSchema.id, purchaseOrder.id))
      .returning();
    const updatedPO = updatedPOs[0];

    if (!updatedPO) {
      throw new GraphQLError("Purchase order not found");
    }

    const userTickets = await DB.query.userTicketsSchema.findMany({
      where: (t, { eq }) => eq(t.purchaseOrderId, purchaseOrderId),
    });

    const userTicketsIds = userTickets.map((t) => t.id);

    return {
      purchaseOrder: selectPurchaseOrdersSchema.parse(updatedPO),
      ticketsIds: userTicketsIds,
    };
  }

  const paymentIntent = await createPaymentIntent({
    context: {
      GET_STRIPE_CLIENT,
      GET_MERCADOPAGO_CLIENT,
      logger,
      DB,
      USER,
    },
    purchaseOrderId: purchaseOrder.id,
    paymentSuccessRedirectURL: paymentSuccessRedirectURL,
    paymentCancelRedirectURL: paymentCancelRedirectURL,
    currency,
    userTickets: purchaseOrderInfo,
    totalAmount,
  });

  return {
    purchaseOrder: paymentIntent.purchaseOrder,
    ticketsIds: paymentIntent.ticketsIds,
  };
};

type PaymentPlatformIntent = {
  paymentPlatform: PurchaseOrderPaymentPlatform;
  paymentPlatformPaymentLink: string;
  paymentPlatformReferenceID: string;
  paymentPlatformStatus: string;
  paymentPlatformExpirationDate: Date;
  totalPrice: string;
};

const createPaymentIntent = async ({
  context,
  purchaseOrderId,
  paymentSuccessRedirectURL,
  paymentCancelRedirectURL,
  currency,
  userTickets,
}: {
  context: NonNullableFields<
    Pick<
      Context,
      "GET_STRIPE_CLIENT" | "GET_MERCADOPAGO_CLIENT" | "logger" | "USER" | "DB"
    >
  >;
  purchaseOrderId: string;
  paymentSuccessRedirectURL: string;
  paymentCancelRedirectURL: string;
  currency: {
    id: string;
    currency: string;
  };
  userTickets: Awaited<ReturnType<typeof fetchPurchaseOrderInformation>>;
  totalAmount: number;
}) => {
  const { DB, GET_STRIPE_CLIENT, GET_MERCADOPAGO_CLIENT, logger, USER } =
    context;

  let paymentPlatformData: PaymentPlatformIntent;
  const currencyCode = currency.currency;

  const updatedProducts = await DB.transaction(async (trx) => {
    const uniqueTickets = userTickets
      .map(({ ticketTemplate }) => {
        const price = ticketTemplate.ticketsPrices.find(
          (p) => p.price.currency.id === currency.id,
        )?.price;

        return {
          ...ticketTemplate,
          price: price ? { amount: price.price_in_cents } : null,
        };
      })
      .filter((t, index, self) => {
        // We filter out duplicate tickets
        return self.findIndex((t2) => t2.id === t.id) === index;
      });

    return ensureProductsAreCreated({
      currency,
      tickets: uniqueTickets,
      getStripeClient: GET_STRIPE_CLIENT,
      transactionHandler: trx,
      logger,
    });
  });

  const updatedUserTickets = userTickets.map((userTicket) => {
    const updatedTicket = updatedProducts.tickets.find(
      (ut) => ut.id === userTicket.ticketTemplate.id,
    );

    if (!updatedTicket) {
      throw new Error(
        `Ticket ${userTicket.ticketTemplate.id} not found in updated tickets`,
      );
    }

    return {
      ...userTicket,
      ticketTemplate: updatedTicket,
    };
  });

  if (currencyCode === "USD") {
    paymentPlatformData = await createStripePaymentIntent({
      userTickets: updatedUserTickets,
      purchaseOrderId,
      GET_STRIPE_CLIENT,
      paymentSuccessRedirectURL,
      paymentCancelRedirectURL,
      logger,
    });
  } else if (currencyCode === "CLP") {
    paymentPlatformData = await createMercadoPagoPaymentIntent({
      userTickets: updatedUserTickets,
      purchaseOrderId,
      USER,
      paymentSuccessRedirectURL,
      paymentCancelRedirectURL,
      GET_MERCADOPAGO_CLIENT,
      logger,
    });
  } else {
    throw new Error("Unsupported currency");
  }

  logger.info("payment created, updating purchase order", {
    paymentPlatformData,
  });

  const {
    totalPrice,
    paymentPlatform,
    paymentPlatformPaymentLink,
    paymentPlatformReferenceID,
    paymentPlatformStatus,
    paymentPlatformExpirationDate,
  } = paymentPlatformData;

  const updatedPurchaseOrders = await DB.update(purchaseOrdersSchema)
    .set({
      totalPrice,
      paymentPlatform,
      paymentPlatformPaymentLink,
      paymentPlatformReferenceID,
      paymentPlatformStatus,
      paymentPlatformExpirationDate,
      purchaseOrderPaymentStatus: "unpaid",
      currencyId: currency.id,
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

function calculateTotalAmount(
  userTickets: Awaited<ReturnType<typeof fetchPurchaseOrderInformation>>,
  currencyId: string,
) {
  let totalAmount = 0;
  let allTicketsAreFree = true;

  for (const userTicket of userTickets) {
    if (userTicket.ticketTemplate.isFree) {
      continue;
    }

    const ticketPrice = userTicket.ticketTemplate.ticketsPrices.find(
      (tp) => tp.price.currency.id === currencyId,
    );

    if (!ticketPrice) {
      throw new Error(
        `Ticket price not found for ticket ${userTicket.ticketTemplate.id}`,
      );
    }

    totalAmount += ticketPrice.price.price_in_cents;

    allTicketsAreFree = false;
  }

  return { totalAmount, allTicketsAreFree };
}

type SyncPurchaseOrderPaymentStatusArgs = {
  DB: Context["DB"];
  purchaseOrderId: string;
  GET_STRIPE_CLIENT: Context["GET_STRIPE_CLIENT"];
  GET_MERCADOPAGO_CLIENT: Context["GET_MERCADOPAGO_CLIENT"];
  logger: Logger;
  transactionalEmailService: Context["RPC_SERVICE_EMAIL"];
};

export const syncPurchaseOrderPaymentStatus = async ({
  DB,
  purchaseOrderId,
  GET_STRIPE_CLIENT,
  GET_MERCADOPAGO_CLIENT,
  transactionalEmailService,
  logger,
}: SyncPurchaseOrderPaymentStatusArgs) => {
  logger.info("Finding purchase order:", purchaseOrderId);

  const purchaseOrder = await DB.query.purchaseOrdersSchema
    .findFirst({
      where: (po, { eq, isNotNull }) =>
        and(
          eq(po.id, purchaseOrderId),
          isNotNull(po.paymentPlatformReferenceID),
        ),
      with: {
        currency: {
          columns: {
            currency: true,
          },
        },
        user: {
          columns: {
            id: true,
            email: true,
            name: true,
            username: true,
          },
        },
      },
    })
    .then(async (res) => {
      if (!res) {
        return null;
      }

      // We fetch the user tickets for the purchase order separately
      // because if we use the "with" clause it fails
      // (due to the "with" clause being too nested i think)
      const userTickets = await DB.query.userTicketsSchema.findMany({
        where: (t, { eq }) => eq(t.purchaseOrderId, purchaseOrderId),
        with: {
          ticketTemplate: {
            with: {
              event: {
                with: {
                  logoImageReference: true,
                  eventsToCommunities: {
                    with: {
                      community: {
                        columns: {
                          name: true,
                          slug: true,
                          logoImageSanityRef: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          transferAttempts: {
            columns: {
              id: true,
              transferMessage: true,
            },
            with: {
              recipientUser: {
                columns: {
                  email: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      return {
        ...res,
        userTickets,
      };
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

  let poPaymentStatus: PurchaseOrderPaymentStatus =
    purchaseOrder.purchaseOrderPaymentStatus;
  let poStatus: PurchaseOrderStatus = purchaseOrder.status;

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
  }

  if (
    poPaymentStatus !== purchaseOrder.purchaseOrderPaymentStatus ||
    poStatus !== purchaseOrder.status
  ) {
    logger.info(`Updating purchase order ${purchaseOrderId} status`, {
      poPaymentStatus,
      poStatus,
    });
    // we update the purchase order with the new status, only if they are different from the current status
    const updatedPurchaseOrder = await DB.transaction(async (trx) => {
      try {
        const updatedPOs = await trx
          .update(purchaseOrdersSchema)
          .set({
            purchaseOrderPaymentStatus: poPaymentStatus,
            status: poStatus,
          })
          .where(eq(purchaseOrdersSchema.id, purchaseOrderId))
          .returning();
        const updatedPO = updatedPOs[0];

        if (!updatedPO) {
          throw new Error("OC no encontrada");
        }

        if (poPaymentStatus === "paid") {
          for (const userTicket of purchaseOrder.userTickets) {
            if (userTicket.transferAttempts.length > 0) {
              await trx
                .update(userTicketsSchema)
                .set({
                  approvalStatus: "transfer_pending",
                })
                .where(eq(userTicketsSchema.id, userTicket.id));

              const expirationDate = getExpirationDateForTicketTransfer();

              for (const transferAttempt of userTicket.transferAttempts) {
                await transactionalEmailService.sendTransferTicketConfirmations(
                  {
                    transferMessage: transferAttempt.transferMessage,
                    recipientEmail: transferAttempt.recipientUser.email,
                    recipientName:
                      transferAttempt.recipientUser.name ??
                      transferAttempt.recipientUser.username,
                    senderName:
                      purchaseOrder.user.name ?? purchaseOrder.user.username,
                    ticketTags: userTicket.ticketTemplate.tags,
                    transferId: transferAttempt.id,
                    expirationDate: expirationDate,
                    senderEmail: purchaseOrder.user.email,
                  },
                );
              }

              const updateTransferValues: Partial<InsertUserTicketTransferSchema> =
                {
                  expirationDate: expirationDate,
                };

              await trx
                .update(userTicketTransfersSchema)
                .set(updateTransferValues)
                .where(
                  inArray(
                    userTicketTransfersSchema.id,
                    userTicket.transferAttempts.map((ga) => ga.id),
                  ),
                );
            } else {
              await trx
                .update(userTicketsSchema)
                .set({
                  approvalStatus: "approved",
                })
                .where(eq(userTicketsSchema.id, userTicket.id));
            }
          }

          await sendPurchaseOrderSuccessfulEmail({
            transactionalEmailService,
            logger,
            purchaseOrder,
          });
        }

        return updatedPO;
      } catch (error) {
        logger.error(
          "syncPurchaseOrderPaymentStatus: Error updating purchase order status",
          error,
        );

        trx.rollback();
        throw error;
      }
    });

    return updatedPurchaseOrder;
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

  if (expiredOrders.length > 0) {
    await DB.update(userTicketsSchema)
      .set({
        approvalStatus: "cancelled",
      })
      .where(
        inArray(
          userTicketsSchema.purchaseOrderId,
          expiredOrders.map((po) => po.id),
        ),
      )
      .returning();
  }

  return expiredOrders;
};
