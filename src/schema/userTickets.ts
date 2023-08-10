import { builder } from "~/builder";
import { UserTicketRef } from "./shared/refs";
import { SQL, eq } from "drizzle-orm";
import {
  selectUserTicketsSchema,
  eventsSchema,
  userTicketsSchema,
} from "~/datasources/db/schema";

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
