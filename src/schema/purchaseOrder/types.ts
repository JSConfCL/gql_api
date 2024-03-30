import { builder } from "~/builder";
import {
  selectUserTicketsSchema,
  selectPurchaseOrdersSchema,
  selectAllowedCurrencySchema,
  puchaseOrderPaymentStatusEnum,
} from "~/datasources/db/schema";
import { AllowedCurrencyRef, UserTicketRef } from "~/schema/shared/refs";

const PurchaseOrderStatusEnum = builder.enumType("PurchaseOrderStatusEnum", {
  values: puchaseOrderPaymentStatusEnum,
});

export const PurchaseOrderRef = builder.objectRef<{
  id: string;
  finalPrice?: number;
  ticketsIds: string[];
  purchaseOrder: typeof selectPurchaseOrdersSchema._type;
}>("PurchaseOrder");

builder.objectType(PurchaseOrderRef, {
  description: "Representation of a Purchase Order",
  fields: (t) => ({
    id: t.exposeID("id"),
    finalPrice: t.field({
      type: "Float",
      nullable: true,
      resolve: (root) => {
        return root.finalPrice ?? 0;
      },
    }),
    paymentLink: t.field({
      type: "String",
      nullable: true,
      resolve: (root) => {
        return root.purchaseOrder.paymentPlatformPaymentLink;
      },
    }),
    currency: t.field({
      type: AllowedCurrencyRef,
      nullable: true,
      resolve: async (root, args, ctx) => {
        const currencyId = root.purchaseOrder.currencyId;
        if (root.finalPrice && currencyId) {
          const currency = await ctx.DB.query.allowedCurrencySchema.findFirst({
            where: (acs, { eq }) => eq(acs.id, currencyId),
          });
          if (currency) {
            return selectAllowedCurrencySchema.parse(currency);
          }
        }
      },
    }),
    status: t.field({
      type: PurchaseOrderStatusEnum,
      nullable: true,
      resolve: (root) => {
        return root.purchaseOrder.purchaseOrderPaymentStatus;
      },
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
