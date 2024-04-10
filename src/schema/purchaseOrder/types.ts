import { builder } from "~/builder";
<<<<<<< Updated upstream
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
  ticketsIds: string[];
  purchaseOrder: typeof selectPurchaseOrdersSchema._type;
=======
import { selectUserTicketsSchema } from "~/datasources/db/schema";
import { UserTicketRef } from "~/schema/shared/refs";

export const PurchaseOrderRef = builder.objectRef<{
  id: string;
  amount?: number;
  ticketsIds: string[];
>>>>>>> Stashed changes
}>("PurchaseOrder");

builder.objectType(PurchaseOrderRef, {
  description: "Representation of a Purchase Order",
  fields: (t) => ({
<<<<<<< Updated upstream
    id: t.field({
      type: "ID",
      nullable: false,
      resolve: (root) => root.purchaseOrder.id,
    }),
    finalPrice: t.field({
      type: "Float",
      nullable: true,
      resolve: (root) => {
        return root.purchaseOrder.totalPrice
          ? parseFloat(root.purchaseOrder.totalPrice)
          : null;
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
        if (root.purchaseOrder.totalPrice && currencyId) {
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
=======
    id: t.exposeID("id"),
    totalAmount: t.field({
      type: "Float",
      nullable: true,
      resolve: (root) => root.amount,
>>>>>>> Stashed changes
    }),
    tickets: t.field({
      type: [UserTicketRef],
      resolve: async (root, s, { DB }) => {
        const userTickets = await DB.query.userTicketsSchema.findMany({
<<<<<<< Updated upstream
          where: (ut, { eq, and }) =>
            and(eq(ut.purchaseOrderId, root.purchaseOrder.id)),
=======
          where: (ut, { eq, and }) => and(eq(ut.purchaseOrderId, root.id)),
>>>>>>> Stashed changes
        });
        return userTickets.map((ut) => selectUserTicketsSchema.parse(ut));
      },
    }),
  }),
});
