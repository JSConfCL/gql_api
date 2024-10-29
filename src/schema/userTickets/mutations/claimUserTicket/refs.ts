import { builder } from "~/builder";
import { PurchaseOrderRef } from "~/schema/purchaseOrder/types";
import { UserTicketTransferInfoInputRef } from "~/schema/userTicketsTransfers/mutations";
import { InferPothosInputType, InferPothosOutputType } from "~/types";

const PurchaseOrderItemDetailsInputRef = builder.inputType(
  "PurchaseOrderItemDetailsInput",
  {
    fields: (t) => ({
      transferInfo: t.field({
        type: UserTicketTransferInfoInputRef,
        required: false,
      }),
    }),
  },
);

const PurchaseOrderInput = builder.inputType("PurchaseOrderInput", {
  fields: (t) => ({
    ticketId: t.string({ required: true }),
    quantity: t.int({ required: true }),
    itemsDetails: t.field({
      type: [PurchaseOrderItemDetailsInputRef],
      required: false,
    }),
  }),
});

const GeneratePaymentLinkInput = builder.inputType("GeneratePaymentLinkInput", {
  fields: (t) => ({
    currencyId: t.string({ required: true }),
  }),
});

export const TicketClaimInput = builder.inputType("TicketClaimInput", {
  fields: (t) => ({
    generatePaymentLink: t.field({
      type: GeneratePaymentLinkInput,
      description:
        "If this field is passed, a purchase order payment link will be generated right away",
      required: false,
    }),
    purchaseOrder: t.field({ type: [PurchaseOrderInput], required: true }),
  }),
});

export type TicketClaimInputType = InferPothosInputType<
  typeof builder,
  typeof TicketClaimInput
>;

const RedeemUserTicketErrorRef = builder.objectRef<{
  error: true;
  errorMessage: string;
}>("RedeemUserTicketError");

const RedeemUserTicketError = builder.objectType(RedeemUserTicketErrorRef, {
  fields: (t) => ({
    error: t.field({
      type: "Boolean",
      resolve: () => true,
    }),
    errorMessage: t.exposeString("errorMessage", {}),
  }),
});

export type RedeemUserTicketErrorType = InferPothosOutputType<
  typeof builder,
  typeof RedeemUserTicketErrorRef
>;

export const RedeemUserTicketResponse = builder.unionType(
  "RedeemUserTicketResponse",
  {
    types: [PurchaseOrderRef, RedeemUserTicketError],
    resolveType: (value) =>
      "errorMessage" in value ? RedeemUserTicketError : PurchaseOrderRef,
  },
);
