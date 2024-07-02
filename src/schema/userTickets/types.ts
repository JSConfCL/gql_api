import { builder } from "~/builder";
import {
  userTicketsApprovalStatusEnum,
  puchaseOrderPaymentStatusEnum,
  userTicketsRedemptionStatusEnum,
} from "~/datasources/db/schema";
import { UserTicketRef } from "~/schema/shared/refs";
import { TicketLoadableObject } from "~/schema/ticket/types";

export const TicketPaymentStatus = builder.enumType("TicketPaymentStatus", {
  values: puchaseOrderPaymentStatusEnum,
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
    ticketTemplate: t.field({
      type: TicketLoadableObject,
      resolve: async (root, args, ctx) => {
        // TODO: Consider data loaders
        const ticketTemplate = await ctx.DB.query.ticketsSchema.findFirst({
          where: (c, { eq }) => eq(c.id, root.ticketTemplateId),
        });

        if (!ticketTemplate) {
          throw new Error("Ticket template not found");
        }

        return ticketTemplate;
      },
    }),
  }),
});

export const RedeemUserTicketErrorRef = builder.objectRef<{
  error: true;
  errorMessage: string;
}>("RedeemUserTicketError");

export const RedeemUserTicketError = builder.objectType(
  RedeemUserTicketErrorRef,
  {
    fields: (t) => ({
      error: t.field({
        type: "Boolean",
        resolve: () => true,
      }),
      errorMessage: t.exposeString("errorMessage", {}),
    }),
  },
);
