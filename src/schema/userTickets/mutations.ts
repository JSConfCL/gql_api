import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  insertPurchaseOrdersSchema,
  insertUserTicketsSchema,
  purchaseOrdersSchema,
  selectPurchaseOrdersSchema,
  selectUserTicketsSchema,
  userTicketsSchema,
} from "~/datasources/db/schema";
import { getPurchaseRedirectURLsFromPurchaseOrder } from "~/schema/purchaseOrder/helpers";
import { PurchaseOrderRef } from "~/schema/purchaseOrder/types";
import { isValidUUID } from "~/schema/shared/helpers";
import { UserTicketRef } from "~/schema/shared/refs";
import {
  canApproveTicket,
  canCancelUserTicket,
  canRedeemUserTicket,
} from "~/validations";

import { RedeemUserTicketError } from "./types";
import { createPaymentIntent } from "../purchaseOrder/actions";

const PurchaseOrderInput = builder.inputType("PurchaseOrderInput", {
  fields: (t) => ({
    ticketId: t.string({
      required: true,
    }),
    quantity: t.int({
      required: true,
    }),
  }),
});

const GeneratePaymentLinkInput = builder.inputType("GeneratePaymentLinkInput", {
  fields: (t) => ({
    currencyId: t.string({
      required: true,
    }),
  }),
});

const TicketClaimInput = builder.inputType("TicketClaimInput", {
  fields: (t) => ({
    generatePaymentLink: t.field({
      type: GeneratePaymentLinkInput,
      description:
        "If this field is passed, a purchase order payment link will be generated right away",
      required: false,
    }),
    purchaseOrder: t.field({
      type: [PurchaseOrderInput],
      required: true,
    }),
    idempotencyUUIDKey: t.string({
      description:
        "A unique key to prevent duplicate requests, it's optional to send, but it's recommended to send it to prevent duplicate requests. If not sent, it will be created by the server.",
      required: false,
    }),
  }),
});

const RedeemUserTicketResponse = builder.unionType("RedeemUserTicketResponse", {
  types: [PurchaseOrderRef, RedeemUserTicketError],
  resolveType: (value) => {
    if ("errorMessage" in value) {
      return RedeemUserTicketError;
    }

    return PurchaseOrderRef;
  },
});

builder.mutationField("cancelUserTicket", (t) =>
  t.field({
    description: "Cancel a ticket",
    type: UserTicketRef,
    args: {
      userTicketId: t.arg({
        type: "String",
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { userTicketId }, ctx) => {
      try {
        if (!ctx.USER) {
          throw new GraphQLError("User not found");
        }

        if (!(await canCancelUserTicket(ctx.USER?.id, userTicketId, ctx.DB))) {
          throw new GraphQLError("You can't cancel this ticket");
        }

        let ticket = await ctx.DB.query.userTicketsSchema.findFirst({
          where: (t, { eq }) => eq(t.id, userTicketId),
        });

        ticket = (
          await ctx.DB.update(userTicketsSchema)
            .set({
              approvalStatus: "cancelled",
              deletedAt: new Date(),
            })
            .where(eq(userTicketsSchema.id, userTicketId))
            .returning()
        )?.[0];

        return selectUserTicketsSchema.parse(ticket);
      } catch (e: unknown) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
);

builder.mutationField("approvalUserTicket", (t) =>
  t.field({
    description: "Approve a ticket",
    type: UserTicketRef,
    args: {
      userTicketId: t.arg({
        type: "String",
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { userTicketId }, { DB, USER }) => {
      try {
        if (!USER) {
          throw new GraphQLError("User not found");
        }

        if (!(await canApproveTicket(USER.id, userTicketId, DB))) {
          throw new GraphQLError("Unauthorized!");
        }

        const ticket = await DB.query.userTicketsSchema.findFirst({
          where: (t, { eq }) => eq(t.id, userTicketId),
          with: {
            ticketTemplate: true,
          },
        });

        if (!ticket) {
          throw new GraphQLError("Unauthorized!");
        }

        if (!USER) {
          throw new GraphQLError("User not found");
        }

        if (ticket.approvalStatus === "approved") {
          throw new GraphQLError("Ticket already approved");
        }

        if (!ticket.ticketTemplate?.requiresApproval) {
          throw new GraphQLError("Ticket does not require approval");
        }

        const updatedTicket = (
          await DB.update(userTicketsSchema)
            .set({
              approvalStatus: "approved",
            })
            .where(eq(userTicketsSchema.id, userTicketId))
            .returning()
        )?.[0];

        return selectUserTicketsSchema.parse(updatedTicket);
      } catch (e: unknown) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
);

builder.mutationField("redeemUserTicket", (t) =>
  t.field({
    description: "Redeem a ticket",
    type: UserTicketRef,
    args: {
      userTicketId: t.arg({
        type: "String",
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { userTicketId }, { USER, DB }) => {
      try {
        if (!USER) {
          throw new GraphQLError("User not found");
        }

        if (!(await canRedeemUserTicket(USER?.id, userTicketId, DB))) {
          throw new GraphQLError("No tienes permisos para redimir este ticket");
        }

        const ticket = await DB.query.userTicketsSchema.findFirst({
          where: (t, { eq }) => eq(t.id, userTicketId),
        });

        if (!ticket) {
          throw new GraphQLError("Unauthorized!");
        }

        if (ticket.approvalStatus === "cancelled") {
          throw new GraphQLError("No es posible redimir un ticket cancelado");
        }

        if (ticket.approvalStatus === "rejected") {
          throw new GraphQLError("No es posible redimir un ticket rechazado");
        }

        if (ticket.redemptionStatus === "redeemed") {
          return selectUserTicketsSchema.parse(ticket);
        }

        const updatedTicket = (
          await DB.update(userTicketsSchema)
            .set({
              redemptionStatus: "redeemed",
            })
            .where(eq(userTicketsSchema.id, userTicketId))
            .returning()
        )?.[0];

        return selectUserTicketsSchema.parse(updatedTicket);
      } catch (e: unknown) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
);

builder.mutationField("claimUserTicket", (t) =>
  t.field({
    description: "Attempt to claim a certain ammount of tickets",
    type: RedeemUserTicketResponse,
    args: {
      input: t.arg({
        type: TicketClaimInput,
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (
      root,
      { input: { purchaseOrder, idempotencyUUIDKey, generatePaymentLink } },
      {
        USER,
        DB,
        GET_STRIPE_CLIENT,
        PURCHASE_CALLBACK_URL,
        GET_MERCADOPAGO_CLIENT,
        logger,
        RPC_SERVICE_EMAIL,
      },
    ) => {
      if (!USER) {
        throw new GraphQLError("User not found");
      }

      if (idempotencyUUIDKey && !isValidUUID(idempotencyUUIDKey)) {
        throw new GraphQLError("Idempotency key is not a valid UUID");
      }

      // We try to reserve as many tickets as exist in purchaseOrder array. we
      // create a transaction to check on the tickets and reserve them. We
      // reverse the transacion if we find that:
      // - We would be going over the limit of tickets.
      // - We don't have enough tickets to fulfill the purchase order.
      // - Other General errors
      let transactionError: null | GraphQLError = null;

      try {
        const transactionResults = await DB.transaction(async (trx) => {
          try {
            if (idempotencyUUIDKey) {
              const existingPurchaseOrder =
                await trx.query.purchaseOrdersSchema.findFirst({
                  where: (po, { eq }) =>
                    eq(po.idempotencyUUIDKey, idempotencyUUIDKey),
                });

              if (existingPurchaseOrder) {
                throw new Error(
                  `Purchase order with idempotency key ${idempotencyUUIDKey} already exists.`,
                );
              }
            }

            // We create a purchase order to keep track of the tickets we create.
            const createdPurchaseOrders = await trx
              .insert(purchaseOrdersSchema)
              .values(
                insertPurchaseOrdersSchema.parse({
                  userId: USER.id,
                  idempotencyUUIDKey: idempotencyUUIDKey ?? undefined,
                }),
              )
              .returning()
              .execute();
            let claimedTickets: Array<typeof insertUserTicketsSchema._type> =
              [];

            const createdPurchaseOrder = createdPurchaseOrders[0];

            if (!createdPurchaseOrder) {
              throw new Error("Could not create purchase order");
            }

            // TODO: Measure and consider parallelizing this.
            for (const item of purchaseOrder) {
              // We pull the ticket template to see if it exists.
              const ticketTemplate = await trx.query.ticketsSchema.findFirst({
                where: (t, { eq }) => eq(t.id, item.ticketId),
                with: {
                  event: true,
                  ticketsPrices: {
                    with: {
                      price: true,
                    },
                  },
                },
              });

              // If the ticket template does not exist, we throw an error.
              if (!ticketTemplate) {
                throw new Error(
                  `Ticket template with id ${item.ticketId} not found`,
                );
              }

              const requiresPayment =
                ticketTemplate.ticketsPrices &&
                ticketTemplate.ticketsPrices.length > 0 &&
                ticketTemplate.ticketsPrices.some(
                  (tp) =>
                    tp?.price?.price_in_cents !== null &&
                    tp?.price?.price_in_cents > 0,
                );
              const { status } = ticketTemplate.event;
              const isEventActive = status === "active";

              // If the event is not active, we throw an error.
              if (!isEventActive) {
                throw new Error(
                  `Event ${ticketTemplate.event.id} is not active. Cannot claim tickets for an inactive event.`,
                );
              }

              // We pull the tickets that are already reserved or in-process to
              // see if we have enough to fulfill the purchase order
              const tickets = await trx.query.userTicketsSchema.findMany({
                where: (uts, { eq, and, notInArray }) =>
                  and(
                    eq(uts.ticketTemplateId, item.ticketId),
                    notInArray(uts.approvalStatus, ["rejected", "cancelled"]),
                  ),
              });

              // If the ticket template has a quantity field,  means there's a
              // limit to the amount of tickets that can be created. So we check
              // if we have enough tickets to fulfill the purchase order.
              if (ticketTemplate.quantity) {
                // If we would be going over the limit of tickets, we throw an
                // error.
                if (tickets.length + item.quantity > ticketTemplate.quantity) {
                  throw new Error(
                    `Not enough tickets for ticket template with id ${item.ticketId}`,
                  );
                }
              }

              const isApproved =
                ticketTemplate.isFree && !ticketTemplate.requiresApproval;

              // If no errors were thrown, we can proceed to reserve the
              // tickets.
              const newTickets = new Array(item.quantity)
                .fill(false)
                .map(() => {
                  const result = insertUserTicketsSchema.safeParse({
                    userId: USER.id,
                    purchaseOrderId: createdPurchaseOrder.id,
                    ticketTemplateId: ticketTemplate.id,
                    paymentStatus: requiresPayment ? "unpaid" : "not_required",
                    approvalStatus: isApproved ? "approved" : "pending",
                  });

                  if (result.success) {
                    return result.data;
                  }

                  logger.error("Could not parse user ticket", result.error);
                })
                .filter(Boolean);

              logger.info(
                `Creating ${newTickets.length} user tickets for ticket template with id ${item.ticketId}`,
                { newTickets, item },
              );

              if (newTickets.length === 0) {
                throw new Error("Could not create user tickets");
              }

              const createdUserTickets = await trx
                .insert(userTicketsSchema)
                .values(newTickets)
                .returning()
                .execute();

              //  if the ticket has a quantity field, we  do a last check to see
              //  if we have enough gone over the limit of tickets.
              const finalTickets = await trx.query.userTicketsSchema.findMany({
                where: (uts, { eq, and, inArray }) =>
                  and(
                    eq(uts.ticketTemplateId, item.ticketId),
                    inArray(uts.approvalStatus, ["approved", "pending"]),
                  ),
              });

              if (ticketTemplate.quantity) {
                if (finalTickets.length > ticketTemplate.quantity) {
                  throw new Error(
                    `We have gone over the limit of tickets for ticket template with id ${item.ticketId}`,
                  );
                }
              }

              claimedTickets = [...claimedTickets, ...createdUserTickets];
            }

            const foundPurchaseOrder =
              await trx.query.purchaseOrdersSchema.findFirst({
                where: (po, { eq }) => eq(po.id, createdPurchaseOrder.id),
              });

            if (!foundPurchaseOrder) {
              throw new Error("Could not find purchase order");
            }

            const selectedPurchaseOrder =
              selectPurchaseOrdersSchema.parse(foundPurchaseOrder);

            if (generatePaymentLink) {
              logger.info("Extracting redirect URLs for purchase order");
              const { paymentSuccessRedirectURL, paymentCancelRedirectURL } =
                await getPurchaseRedirectURLsFromPurchaseOrder({
                  DB: trx,
                  purchaseOrderId: createdPurchaseOrder.id,
                  default_redirect_url: PURCHASE_CALLBACK_URL,
                });

              const { purchaseOrder, ticketsIds } = await createPaymentIntent({
                DB: trx,
                USER,
                purchaseOrderId: createdPurchaseOrder.id,
                GET_STRIPE_CLIENT,
                paymentCancelRedirectURL,
                paymentSuccessRedirectURL,
                GET_MERCADOPAGO_CLIENT,
                currencyId: generatePaymentLink.currencyId,
                logger,
                transactionalEmailService: RPC_SERVICE_EMAIL,
              });
              const tickets = await trx.query.userTicketsSchema.findMany({
                where: (uts, { inArray }) => inArray(uts.id, ticketsIds),
              });

              return {
                selectedPurchaseOrder: purchaseOrder,
                claimedTickets: tickets,
              };
            }

            return { selectedPurchaseOrder, claimedTickets };
          } catch (e) {
            logger.error((e as Error).message);

            transactionError =
              e instanceof Error
                ? new GraphQLError(e.message, {
                    originalError: e,
                  })
                : new GraphQLError("Unknown error");

            trx.rollback();
            throw e;
          }
        });

        const { claimedTickets, selectedPurchaseOrder } = transactionResults;
        const ticketsIds = claimedTickets.flatMap((t) => (t.id ? [t.id] : []));

        return {
          purchaseOrder: selectedPurchaseOrder,
          ticketsIds,
        };
      } catch (e: unknown) {
        if (transactionError) {
          logger.error("🚨Transaction error", transactionError);

          return {
            error: true as const,
            errorMessage: (transactionError as GraphQLError).message,
          };
        }

        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
);

builder.mutationField("acceptGiftedTicket", (t) =>
  t.field({
    type: UserTicketRef,
    args: {
      userTicketId: t.arg.string({
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { userTicketId }, { DB, USER }) => {
      if (!USER) {
        throw new GraphQLError("User not found");
      }

      // find the ticket for the user
      const ticket = await DB.query.userTicketsSchema.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.id, userTicketId), eq(t.userId, USER.id)),
      });

      if (!ticket) {
        throw new GraphQLError("Could not find ticket to accept");
      }

      if (ticket.approvalStatus !== "gifted") {
        throw new GraphQLError("Ticket is not a gifted ticket");
      }

      const updatedTicket = (
        await DB.update(userTicketsSchema)
          .set({
            approvalStatus: "approved",
          })
          .where(eq(userTicketsSchema.id, userTicketId))
          .returning()
      )?.[0];

      return selectUserTicketsSchema.parse(updatedTicket);
    },
  }),
);
