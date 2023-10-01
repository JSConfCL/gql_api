import { builder } from "~/builder";
import { UserTicketRef } from "./shared/refs";
import { SQL, eq } from "drizzle-orm";
import {
  selectUserTicketsSchema,
  eventsSchema,
  userTicketsSchema,
  insertUserTicketsSchema,
} from "~/datasources/db/schema";
import { GraphQLError } from "graphql";
import { v4 } from "uuid";

export const TicketStatus = builder.enumType("TicketStatus", {
  values: ["active", "cancelled"] as const,
});
export const TicketPaymentStatus = builder.enumType("TicketPaymentStatus", {
  values: ["paid", "unpaid"] as const,
});
export const TicketApprovalStatus = builder.enumType("TicketApprovalStatus", {
  values: ["approved", "pending"] as const,
});
export const TicketRedemptionStatus = builder.enumType(
  "TicketRedemptionStatus",
  {
    values: ["redeemed", "pending"] as const,
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
      rules: ["canCancelUserTicket"],
    },
    resolve: async (root, { userTicketId }, ctx) => {
      try {
        let ticket = await ctx.DB.query.userTicketsSchema.findFirst({
          where: (t, { eq }) => eq(t.id, userTicketId),
        });
        if (!ticket) {
          throw new Error("Unauthorized!");
        }
        if (ticket.status === "cancelled") {
          throw new Error("Ticket already cancelled");
        }
        ticket = await ctx.DB.update(userTicketsSchema)
          .set({
            status: "cancelled",
            deletedAt: new Date(),
          })
          .where(eq(userTicketsSchema.id, userTicketId))
          .returning()
          .get();
        return selectUserTicketsSchema.parse(ticket);
      } catch (e: unknown) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
}));

builder.mutationFields((t) => ({
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
      rules: ["canApproveTicket"],
    },
    resolve: async (root, { userTicketId }, { DB, USER }) => {
      try {
        const ticket = await DB.query.userTicketsSchema.findFirst({
          where: (t, { eq }) => eq(t.id, userTicketId),
          with: {
            ticketTemplate: true,
          },
        });
        if (!ticket) {
          throw new Error("Ticket not found");
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
        const updatedTicket = await DB.update(userTicketsSchema)
          .set({
            approvalStatus: "approved",
          })
          .where(eq(userTicketsSchema.id, userTicketId))
          .returning()
          .get();
        return selectUserTicketsSchema.parse(updatedTicket);
      } catch (e: unknown) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
}));

builder.mutationFields((t) => ({
  createUserTicket: t.field({
    description: "Create user ticket",
    type: UserTicketRef,
    args: {
      ticketId: t.arg({
        type: "String",
        required: true,
      }),
    },
    authz: {
      rules: ["canReserveTicket"],
    },
    resolve: async (root, { ticketId }, { DB, USER }) => {
      try {
        if (!USER) {
          throw new Error("User not found");
        }
        const ticketTemplate = await DB.query.ticketsSchema.findFirst({
          where: (t, { eq }) => eq(t.id, ticketId),
          with: {
            event: true,
          },
        });
        if (!ticketTemplate || !ticketTemplate.event) {
          throw new Error("Unauthorized!");
        }
        if (
          ticketTemplate.event.endDateTime < new Date() ||
          ticketTemplate.endDateTime < new Date()
        ) {
          throw new Error("Event has ended");
        }

        const userTicketsCount = await DB.query.userTicketsSchema
          .findMany({
            where: (t, { and, eq }) =>
              and(
                eq(t.ticketTemplateId, ticketId),
                eq(t.status, "active"),
                eq(t.approvalStatus, "approved"),
              ),
          })
          .then((tickets) => tickets.length);

        if (
          userTicketsCount >= ticketTemplate.quantity ||
          userTicketsCount >= ticketTemplate.event.maxAttendees
        ) {
          throw new Error("Ticket sold out");
        }

        const ticketValues = insertUserTicketsSchema.parse({
          id: v4(),
          userId: USER.id,
          ticketTemplateId: ticketId,
          approvalStatus: ticketTemplate.requiresApproval
            ? "pending"
            : "approved",
        });
        const ticket = await DB.insert(userTicketsSchema)
          .values(ticketValues)
          .returning()
          .get();
        return selectUserTicketsSchema.parse(ticket);
      } catch (e: unknown) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
}));
