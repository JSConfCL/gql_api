import { builder } from "~/builder";
import { UserTicketRef } from "../shared/refs";
import { SQL, eq } from "drizzle-orm";
import {
  selectUserTicketsSchema,
  eventsSchema,
  userTicketsSchema,
  userTicketsStatusEnum,
  userTicketsPaymentStatusEnum,
  userTicketsApprovalStatusEnum,
  userTicketsRedemptionStatusEnum,
  insertUserTicketsSchema,
} from "~/datasources/db/schema";
import { GraphQLError } from "graphql";
import {
  canApproveTicket,
  canCancelUserTicket,
  canRedeemUserTicket,
} from "~/validations";

export const TicketStatus = builder.enumType("TicketStatus", {
  values: userTicketsStatusEnum,
});
export const TicketPaymentStatus = builder.enumType("TicketPaymentStatus", {
  values: userTicketsPaymentStatusEnum,
});
export const TicketApprovalStatus = builder.enumType("TicketApprovalStatus", {
  values: userTicketsApprovalStatusEnum,
});
export const TicketRedemptionStatus = builder.enumType(
  "TicketRedemptionStatus",
  {
    values: userTicketsRedemptionStatusEnum,
  },
);

builder.objectType(UserTicketRef, {
  description: "Representation of a User ticket",
  fields: (t) => ({
    id: t.exposeID("id"),
    status: t.field({
      type: TicketStatus,
      resolve: (root) => root.status,
    }),
    paymentStatus: t.field({
      type: TicketPaymentStatus,
      resolve: (root) => root.paymentStatus,
    }),
    approvalStatus: t.field({
      type: TicketApprovalStatus,
      resolve: (root) => root.approvalStatus,
    }),
    redemptionStatus: t.field({
      type: TicketRedemptionStatus,
      resolve: (root) => root.redemptionStatus,
    }),
  }),
});

const MyTicketsSearchInput = builder.inputType("MyTicketsSearchInput", {
  fields: (t) => ({
    eventId: t.field({
      type: "String",
      required: false,
    }),
    status: t.field({
      type: TicketStatus,
      required: false,
    }),
    paymentStatus: t.field({
      type: TicketPaymentStatus,
      required: false,
    }),
    approvalStatus: t.field({
      type: TicketApprovalStatus,
      required: false,
    }),
    redemptionStatus: t.field({
      type: TicketRedemptionStatus,
      required: false,
    }),
  }),
});

builder.queryFields((t) => ({
  myTickets: t.field({
    description: "Get a list of tickets for the current user",
    type: [UserTicketRef],
    args: {
      input: t.arg({
        type: MyTicketsSearchInput,
        required: false,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { input }, ctx) => {
      const {
        eventId,
        status,
        paymentStatus,
        approvalStatus,
        redemptionStatus,
      } = input ?? {};
      if (!ctx.USER) {
        return [];
      }
      const wheres: SQL[] = [];
      if (eventId) {
        wheres.push(eq(eventsSchema.id, eventId));
      }
      if (status) {
        wheres.push(eq(userTicketsSchema.status, status));
      }
      if (paymentStatus) {
        wheres.push(eq(userTicketsSchema.paymentStatus, paymentStatus));
      }
      if (approvalStatus) {
        wheres.push(eq(userTicketsSchema.approvalStatus, approvalStatus));
      }
      if (redemptionStatus) {
        wheres.push(eq(userTicketsSchema.redemptionStatus, redemptionStatus));
      }
      if (ctx.USER) {
        wheres.push(eq(userTicketsSchema.userId, ctx.USER.id));
      }
      const myTickets = await ctx.DB.query.userTicketsSchema.findMany({
        where: (_, { and }) => and(...wheres),
        with: {
          ticketTemplate: {
            with: {
              event: true,
            },
          },
        },
      });
      return myTickets.map((t) => selectUserTicketsSchema.parse(t));
    },
  }),
}));

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
  }),
});

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
    type: [UserTicketRef],
    args: {
      input: t.arg({
        type: TicketClaimInput,
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { input: { purchaseOrder } }, { USER, DB }) => {
      if (!USER) {
        throw new GraphQLError("User not found");
      }
      // We try to reserve as many tickets as exist in purchaseOrder array.
      // we create a transaction to check on the tickets and reserve them.
      // We reverse the transacion if we find that:
      // - We would be going over the limit of tickets.
      // - We don't have enough tickets to fulfill the purchase order.
      // - Other General errors
      const transactionResults = await DB.transaction(async (trx) => {
        try {
          let claimedTickets: Array<typeof insertUserTicketsSchema._type> = [];
          // TODO: Measure and consider parallelizing this.
          for (const item of purchaseOrder) {
            // We pull the ticket template to see if it exists.
            const ticketTemplate = await trx.query.ticketsSchema.findFirst({
              where: (t, { eq }) => eq(t.id, item.ticketId),
              with: {
                event: true,
              },
            });

            // If the ticket template does not exist, we throw an error.
            if (!ticketTemplate) {
              throw new GraphQLError(
                `Ticket template with id ${item.ticketId} not found`,
              );
            }

            const requiresPayment =
              ticketTemplate.price !== null && ticketTemplate.price > 0;
            const { maxAttendees, status } = ticketTemplate.event;
            const isEventActive = status === "active";
            const requiresApproval = ticketTemplate.requiresApproval;

            // If the event is not active, we throw an error.
            if (!isEventActive) {
              throw new GraphQLError(
                `Event ${ticketTemplate.event.id} is not active. Cannot claim tickets for an inactive event.`,
              );
            }

            // We pull the tickets that are already reserved or in-process  to see if we have enough to fulfill the purchase order
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
              // If we would be going over the limit of tickets, we throw an error.
              if (tickets.length + item.quantity > ticketTemplate.quantity) {
                throw new GraphQLError(
                  `Not enough tickets for ticket template with id ${item.ticketId}`,
                );
              }
            }

            // If the event has a maxAttendees field, we check if we have enough
            // room to fulfill the purchase order.
            if (maxAttendees) {
              // If we would be going over the limit of attendees, we throw an error.
              if (tickets.length + item.quantity > maxAttendees) {
                throw new GraphQLError(
                  `Not enough room on event ${ticketTemplate.event.id}`,
                );
              }
            }

            // If no errors were thrown, we can proceed to reserve the tickets.
            const newTickets = new Array(item.quantity).fill(false).map(() =>
              insertUserTicketsSchema.parse({
                userId: USER.id,
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

            //  if the ticket has a quantity field, we  do a last check to see if we have enough gone over the limit of tickets.
            const finalTickets = await trx.query.userTicketsSchema.findMany({
              where: (uts, { eq, and, inArray }) =>
                and(
                  eq(uts.ticketTemplateId, item.ticketId),
                  inArray(uts.approvalStatus, ["approved", "pending"]),
                ),
            });

            if (ticketTemplate.quantity) {
              if (finalTickets.length > ticketTemplate.quantity) {
                throw new GraphQLError(
                  `We hav gone over the limit of tickets for ticket template with id ${item.ticketId}`,
                );
              }
            }

            claimedTickets = [...claimedTickets, ...createdUserTickets];
          }
          return claimedTickets;
        } catch (e) {
          console.error("🚨Error", e);
          trx.rollback();
          throw new GraphQLError(
            e instanceof Error ? e.message : "Unknown error",
          );
        }
      });

      return transactionResults.map((ticket) =>
        selectUserTicketsSchema.parse(ticket),
      );
    },
  }),
}));
