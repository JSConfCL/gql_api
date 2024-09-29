import { and, count, eq, inArray } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  InsertUserTicketSchema,
  selectPurchaseOrdersSchema,
  selectUserTicketsSchema,
  userTicketsSchema,
} from "~/datasources/db/schema";
import { applicationError, ServiceErrors } from "~/errors";
import {
  createInitialPurchaseOrder,
  getPurchaseRedirectURLsFromPurchaseOrder,
} from "~/schema/purchaseOrder/helpers";
import { PurchaseOrderRef } from "~/schema/purchaseOrder/types";
import { isValidUUID } from "~/schema/shared/helpers";
import { UserTicketRef } from "~/schema/shared/refs";
import {
  assertCanStartTicketClaimingForEvent,
  validateUserDataAndApproveUserTickets,
} from "~/schema/userTickets/helpers";
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
      deprecationReason: "This field is deprecated",
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

        if (ticket.approvalStatus === "approved") {
          throw new GraphQLError("Ticket already approved");
        }

        if (ticket.approvalStatus !== "pending") {
          throw new GraphQLError("Ticket cannot be approved");
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
    description: "Attempt to claim a certain amount of tickets",
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
      { input: { purchaseOrder, generatePaymentLink } },
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

      // We try to reserve as many tickets as exist in purchaseOrder array. we
      // create a transaction to check on the tickets and reserve them. We
      // reverse the transacion if we find that:
      // - We would be going over the limit of tickets.
      // - We don't have enough tickets to fulfill the purchase order.
      // - Other General errors
      let transactionError: null | GraphQLError = null;

      if (purchaseOrder.length === 0) {
        throw applicationError(
          "Purchase order is empty",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      // Aggregate purchase order items by ticket ID
      const purchaseOrderByTickets: Record<
        string,
        {
          ticketId: string;
          quantity: number;
        }
      > = {};

      for (const item of purchaseOrder) {
        if (!isValidUUID(item.ticketId)) {
          throw applicationError(
            "Invalid ticket id",
            ServiceErrors.INVALID_ARGUMENT,
            logger,
          );
        }

        if (item.quantity <= 0) {
          throw applicationError(
            "Invalid quantity",
            ServiceErrors.INVALID_ARGUMENT,
            logger,
          );
        }

        if (!purchaseOrderByTickets[item.ticketId]) {
          purchaseOrderByTickets[item.ticketId] = {
            ticketId: item.ticketId,
            quantity: 0,
          };
        }

        purchaseOrderByTickets[item.ticketId].quantity += item.quantity;
      }

      try {
        const transactionResults = await DB.transaction(async (trx) => {
          try {
            await assertCanStartTicketClaimingForEvent({
              DB: trx,
              user: USER,
              purchaseOrderByTickets,
              logger,
            });

            const ticketTemplatesIds = Object.keys(purchaseOrderByTickets);

            const [createdPurchaseOrder, ticketTemplates] = await Promise.all([
              createInitialPurchaseOrder({
                DB: trx,
                userId: USER.id,
                logger,
              }),
              trx.query.ticketsSchema.findMany({
                where: (t, { inArray }) => inArray(t.id, ticketTemplatesIds),
                with: {
                  event: true,
                  ticketsPrices: {
                    with: {
                      price: true,
                    },
                  },
                },
              }),
            ]);

            const notFoundTicketTemplatesIds = ticketTemplatesIds.filter(
              (ticketId) => !ticketTemplates.find((t) => t.id === ticketId),
            );

            if (notFoundTicketTemplatesIds.length > 0) {
              throw applicationError(
                `Tickets with ids ${notFoundTicketTemplatesIds.join(
                  ", ",
                )} not found`,
                ServiceErrors.NOT_FOUND,
                logger,
              );
            }

            const claimedTickets: InsertUserTicketSchema[] = [];

            // Process each ticket template
            for (const ticketTemplate of ticketTemplates) {
              const { event } = ticketTemplate;
              const quantityToPurchase =
                purchaseOrderByTickets[ticketTemplate.id].quantity;

              // If the event is not active, we throw an error.
              if (event.status === "inactive") {
                throw applicationError(
                  `Event ${event.id} is not active. Cannot claim tickets for an inactive event.`,
                  ServiceErrors.FAILED_PRECONDITION,
                  logger,
                );
              }

              const isApproved =
                ticketTemplate.isFree && !ticketTemplate.requiresApproval;

              const newTickets = new Array(quantityToPurchase)
                .fill(false)
                .map(() => {
                  const next: InsertUserTicketSchema = {
                    userId: USER.id,
                    purchaseOrderId: createdPurchaseOrder.id,
                    ticketTemplateId: ticketTemplate.id,
                    approvalStatus: isApproved ? "approved" : "pending",
                  };

                  return next;
                });

              claimedTickets.push(...newTickets);
            }

            for (const ticketTemplateId of ticketTemplatesIds) {
              const newTickets = claimedTickets.filter(
                (ticket) => ticket.ticketTemplateId === ticketTemplateId,
              );

              logger.info(
                `Creating ${newTickets.length} user tickets for ticket template with id ${ticketTemplateId}`,
              );
            }

            // Bulk insert claimed tickets
            const createdUserTickets = await trx
              .insert(userTicketsSchema)
              .values(claimedTickets)
              .returning()
              .execute();

            // Bulk query for existing ticket counts
            const finalTicketsCount = await trx
              .select({
                ticketTemplateId: userTicketsSchema.ticketTemplateId,
                count: count(userTicketsSchema.id),
              })
              .from(userTicketsSchema)
              .where(
                and(
                  inArray(
                    userTicketsSchema.ticketTemplateId,
                    ticketTemplates.map((t) => t.id),
                  ),
                  inArray(userTicketsSchema.approvalStatus, [
                    "approved",
                    "pending",
                  ]),
                ),
              )
              .groupBy(userTicketsSchema.ticketTemplateId);

            for (const ticketTemplate of ticketTemplates) {
              const existingCount =
                finalTicketsCount.find(
                  (count) => count.ticketTemplateId === ticketTemplate.id,
                )?.count || 0;

              const limitAlreadyReached = ticketTemplate.quantity
                ? existingCount > ticketTemplate.quantity
                : false;

              logger.info(
                `Ticket template with id ${
                  ticketTemplate.id
                } has ${existingCount} tickets ${
                  limitAlreadyReached ? "and has reached its limit" : ""
                }
                `,
              );

              //  if the ticket has a quantity field, we  do a last check to see
              //  if we have enough gone over the limit of tickets.
              if (limitAlreadyReached) {
                throw new Error(
                  `We have gone over the limit of tickets for ticket template with id ${ticketTemplate.id}`,
                );
              }
            }

            // Fetch the created purchase order
            const foundPurchaseOrder =
              await trx.query.purchaseOrdersSchema.findFirst({
                where: (po, { eq }) => eq(po.id, createdPurchaseOrder.id),
              });

            if (!foundPurchaseOrder) {
              throw new Error("Could not find purchase order");
            }

            const selectedPurchaseOrder =
              selectPurchaseOrdersSchema.parse(foundPurchaseOrder);

            // Generate payment link if requested
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

              return {
                purchaseOrder,
                ticketsIds,
              };
            }

            return {
              purchaseOrder: selectedPurchaseOrder,
              ticketsIds: createdUserTickets.map((ticket) => ticket.id),
            };
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

        return transactionResults;
      } catch (e: unknown) {
        logger.error("Error claiming user tickets", e);

        if (transactionError) {
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

builder.mutationField("triggerUserTicketApprovalReview", (t) =>
  t.field({
    type: [UserTicketRef],
    args: {
      eventId: t.arg.string({
        required: true,
      }),
      userId: t.arg.string({
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { userId, eventId }, { DB, USER, logger }) => {
      if (!USER) {
        throw applicationError(
          "User not found",
          ServiceErrors.NOT_FOUND,
          logger,
        );
      }

      if (USER.id !== userId && !USER.isSuperAdmin) {
        throw applicationError(
          "Unauthorized ",
          ServiceErrors.UNAUTHORIZED,
          logger,
        );
      }

      const userTickets = await validateUserDataAndApproveUserTickets({
        DB,
        userId,
        eventId,
        logger,
      });

      return userTickets.map((userTicket) =>
        selectUserTicketsSchema.parse(userTicket),
      );
    },
  }),
);
