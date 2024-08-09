import { builder } from "~/builder";
import {
  userTicketsApprovalStatusEnum,
  puchaseOrderPaymentStatusEnum,
  userTicketsRedemptionStatusEnum,
} from "~/datasources/db/schema";
import {
  PurchaseOrderLoadable,
  PurchaseOrderPaymentStatusEnum,
} from "~/schema/purchaseOrder/types";
import { UserTicketRef } from "~/schema/shared/refs";
import { TicketLoadable } from "~/schema/ticket/types";

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
      type: PurchaseOrderPaymentStatusEnum,
      nullable: true,
      resolve: async (root, arg, context) => {
        const lodaer = PurchaseOrderLoadable.getDataloader(context);
        const purchaseOrder = await lodaer.load(root.purchaseOrderId);

        if (!purchaseOrder) {
          return null;
        }

        return purchaseOrder.purchaseOrder.purchaseOrderPaymentStatus;
      },
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
      type: TicketLoadable,
      resolve: (root) => root.ticketTemplateId,
    }),
    purchaseOrder: t.field({
      type: PurchaseOrderLoadable,
      nullable: true,
      resolve: (root) => root.purchaseOrderId,
    }),
    createdAt: t.field({
      type: "DateTime",
      nullable: false,
      resolve: (root) => new Date(root.createdAt),
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
