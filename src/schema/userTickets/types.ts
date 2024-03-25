import { builder } from "~/builder";
import {
  userTicketsApprovalStatusEnum,
  puchaseOrderPaymentStatusEnum,
  userTicketsRedemptionStatusEnum,
  userTicketsStatusEnum,
  selectUserTicketsSchema,
} from "~/datasources/db/schema";
import { UserTicketRef } from "~/schema/shared/refs";

export const PurchaseOrderRef = builder.objectRef<{
  id: string;
  amount?: number;
  ticketsIds: string[];
}>("PurchaseOrder");

builder.objectType(PurchaseOrderRef, {
  description: "Representation of a Purchase Order",
  fields: (t) => ({
    id: t.exposeID("id"),
    totalAmount: t.field({
      type: "Float",
      nullable: true,
      resolve: (root) => root.amount,
    }),
    tickets: t.field({
      type: [UserTicketRef],
      resolve: async (root, s, { DB }) => {
        const userTickets = await DB.query.userTicketsSchema.findMany({
          where: (ut, { eq, and }) => and(eq(ut.purchaseOrderId, root.id)),
        });
        return userTickets.map((ut) => selectUserTicketsSchema.parse(ut));
      },
    }),
  }),
});

export const TicketStatus = builder.enumType("TicketStatus", {
  values: userTicketsStatusEnum,
});
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
