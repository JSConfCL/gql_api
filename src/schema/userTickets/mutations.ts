import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  insertUserTicketsSchema,
  purchaseOrdersSchema,
  selectUserTicketsSchema,
  userTicketsSchema,
} from "~/datasources/db/schema";
import { UserTicketRef } from "~/schema/shared/refs";
import {
  canApproveTicket,
  canCancelUserTicket,
  canRedeemUserTicket,
} from "~/validations";

import { PurchaseOrderRef, RedeemUserTicketError } from "./types";
import { isValidUUID } from "../shared/helpers";

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

const TicketClaimInput = builder.inputType("TicketClaimInput", {
  fields: (t) => ({
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

export const RedeemUserTicketResponse = builder.unionType(
  "RedeemUserTicketResponse",
  {
    types: [PurchaseOrderRef, RedeemUserTicketError],
    resolveType: (value) => {
      if ("errorMessage" in value) {
        return RedeemUserTicketError;
      }
      return PurchaseOrderRef;
    },
  },
);

builder.mutationFields((t) => ({
  cancelUserTicket: t.field({
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
          throw new Error("User not found");
        }
        if (!(await canCancelUserTicket(ctx.USER?.id, userTicketId, ctx.DB))) {
          throw new Error("You can't cancel this ticket");
        }
        let ticket = await ctx.DB.query.userTicketsSchema.findFirst({
          where: (t, { eq }) => eq(t.id, userTicketId),
        });
        if (ticket?.status === "inactive") {
          throw new Error("Ticket already cancelled");
        }
        ticket = (
          await ctx.DB.update(userTicketsSchema)
            .set({
              status: "inactive",
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
  approvalUserTicket: t.field({
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
          throw new Error("User not found");
        }
        if (!(await canApproveTicket(USER.id, userTicketId, DB))) {
          throw new Error("Unauthorized!");
        }
        const ticket = await DB.query.userTicketsSchema.findFirst({
          where: (t, { eq }) => eq(t.id, userTicketId),
          with: {
            ticketTemplate: true,
          },
        });
        if (!ticket) {
          throw new Error("Unauthorized!");
        }
        if (!USER) {
          throw new Error("User not found");
        }
        if (ticket.approvalStatus === "approved") {
          throw new Error("Ticket already approved");
        }
        if (!ticket.ticketTemplate?.requiresApproval) {
          throw new Error("Ticket does not require approval");
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
  redeemUserTicket: t.field({
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
          throw new Error("User not found");
        }
        if (!(await canRedeemUserTicket(USER?.id, userTicketId, DB))) {
          throw new Error("You can't redeem this ticket");
        }

        const ticket = await DB.query.userTicketsSchema.findFirst({
          where: (t, { eq }) => eq(t.id, userTicketId),
        });
        if (!ticket) {
          throw new Error("Unauthorized!");
        }

        if (ticket.redemptionStatus === "redeemed") {
          throw new Error("Ticket already redeemed");
        }
        if (ticket.status !== "active") {
          throw new Error("Ticket is not active");
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
  claimUserTicket: t.field({
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
      { input: { purchaseOrder, idempotencyUUIDKey } },
      { USER, DB },
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
                return new GraphQLError(
                  `Purchase order with idempotency key ${idempotencyUUIDKey} already exists.`,
                );
              }
            }
            // We create a purchase order to keep track of the tickets we create.
            const createdPurchaseOrders = await trx
              .insert(purchaseOrdersSchema)
              .values({
                userId: USER.id,
                idempotencyUUIDKey: idempotencyUUIDKey ?? undefined,
              })
              .returning()
              .execute();
            let claimedTickets: Array<typeof insertUserTicketsSchema._type> =
              [];

            const createdPurchaseOrder = createdPurchaseOrders[0];
            if (!createdPurchaseOrder) {
              return new Error("Could not create purchase order");
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
                return new Error(
                  `Ticket template with id ${item.ticketId} not found`,
                );
              }

              const requiresPayment =
                ticketTemplate.ticketsPrices &&
                ticketTemplate.ticketsPrices.length > 0 &&
                ticketTemplate.ticketsPrices.some(
                  (tp) => tp?.price?.price !== null && tp?.price?.price > 0,
                );
              const { maxAttendees, status } = ticketTemplate.event;
              const isEventActive = status === "active";
              const requiresApproval = ticketTemplate.requiresApproval;

              // If the event is not active, we throw an error.
              if (!isEventActive) {
                return new Error(
                  `Event ${ticketTemplate.event.id} is not active. Cannot claim tickets for an inactive event.`,
                );
              }

              // We pull the tickets that are already reserved or in-process to
              // see if we have enough to fulfill the purchase order
              const tickets = await trx.query.userTicketsSchema.findMany({
                where: (uts, { eq, and, inArray }) =>
                  and(
                    eq(uts.ticketTemplateId, item.ticketId),
                    inArray(uts.approvalStatus, ["approved", "pending"]),
                  ),
              });

              // If the ticket template has a quantity field,  means there's a
              // limit to the amount of tickets that can be created. So we check
              // if we have enough tickets to fulfill the purchase order.
              if (ticketTemplate.quantity) {
                // If we would be going over the limit of tickets, we throw an
                // error.
                if (tickets.length + item.quantity > ticketTemplate.quantity) {
                  return new Error(
                    `Not enough tickets for ticket template with id ${item.ticketId}`,
                  );
                }
              }

              // If the event has a maxAttendees field, we check if we have
              // enough room to fulfill the purchase order.
              if (maxAttendees) {
                // If we would be going over the limit of attendees, we throw an
                // error.
                if (tickets.length + item.quantity > maxAttendees) {
                  return new Error(
                    `Not enough room on event ${ticketTemplate.event.id}`,
                  );
                }
              }

              // If no errors were thrown, we can proceed to reserve the
              // tickets.
              const newTickets = new Array(item.quantity).fill(false).map(() =>
                insertUserTicketsSchema.parse({
                  userId: USER.id,
                  purchaseOrderId: createdPurchaseOrder.id,
                  ticketTemplateId: ticketTemplate.id,
                  paymentStatus: requiresPayment ? "unpaid" : "not_required",
                  approvalStatus: requiresApproval ? "pending" : "approved",
                }),
              );
              console.log(
                `Creating ${newTickets.length} user tickets for ticket template with id ${item.ticketId}`,
              );
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
                  return new Error(
                    `We hav gone over the limit of tickets for ticket template with id ${item.ticketId}`,
                  );
                }
              }
              claimedTickets = [...claimedTickets, ...createdUserTickets];
            }
            return { createdPurchaseOrder, claimedTickets };
          } catch (e) {
            console.error("🚨Error", e);
            trx.rollback();
            return new Error(e instanceof Error ? e.message : "Unknown error");
          }
        });
        if (transactionResults instanceof Error) {
          return {
            error: true as const,
            errorMessage: transactionResults.message,
          };
        }

        const { claimedTickets, createdPurchaseOrder } = transactionResults;
        const ticketsIds = claimedTickets.flatMap((t) => (t.id ? [t.id] : []));
        return {
          id: createdPurchaseOrder.id,
          ticketsIds,
        };
      } catch (e: unknown) {
        console.error("🚨Error", e);
        return {
          error: true as const,
          errorMessage: e instanceof Error ? e.message : "Unknown error",
        };
      }
    },
  }),
}));
