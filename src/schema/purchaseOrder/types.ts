import { builder } from "~/builder";
import {
  selectUserTicketsSchema,
  selectPurchaseOrdersSchema,
  selectAllowedCurrencySchema,
  puchaseOrderPaymentStatusEnum,
  purchaseOrderStatusEnum,
} from "~/datasources/db/schema";
import { AllowedCurrencyRef, UserTicketRef } from "~/schema/shared/refs";

export const PurchaseOrderPaymentStatusEnum = builder.enumType(
  "PurchaseOrderPaymentStatusEnum",
  {
    values: puchaseOrderPaymentStatusEnum,
  },
);

const PurchaseOrderStatusEnum = builder.enumType("PurchaseOrderStatusEnum", {
  values: purchaseOrderStatusEnum,
});

export const PurchaseOrderRef = builder.objectRef<{
  ticketsIds: string[];
  purchaseOrder: typeof selectPurchaseOrdersSchema._type;
}>("PurchaseOrder");

export const PurchaseOrderLoadable = builder.loadableObject(PurchaseOrderRef, {
  description: "Representation of a Purchase Order",
  load: async (ids: string[], context) => {
    const result = await context.DB.query.purchaseOrdersSchema
      .findMany({
        where: (t, { inArray }) => inArray(t.id, ids),
        with: {
          userTickets: {
            columns: {
              id: true,
            },
          },
        },
      })
      .then((purchaseOrders) => {
        return purchaseOrders.map((somePurchaseOrder) => {
          const ticketsIds = somePurchaseOrder.userTickets.map((ut) => ut.id);

          return {
            ticketsIds,
            purchaseOrder: selectPurchaseOrdersSchema.parse(somePurchaseOrder),
          };
        });
      });

    const resultByIdMap = new Map(
      result.map((item) => [item.purchaseOrder.id, item]),
    );

    return ids.map(
      (id) =>
        resultByIdMap.get(id) || new Error(`Purchase Order ${id} not found`),
    );
  },
  fields: (t) => ({
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
    purchasePaymentStatus: t.field({
      type: PurchaseOrderPaymentStatusEnum,
      nullable: true,
      resolve: (root) => {
        return root.purchaseOrder.purchaseOrderPaymentStatus;
      },
    }),
    status: t.field({
      type: PurchaseOrderStatusEnum,
      nullable: true,
      resolve: (root) => {
        return root.purchaseOrder.status;
      },
    }),
    paymentPlatform: t.field({
      type: "String",
      nullable: true,
      resolve: (root) => {
        return root.purchaseOrder.paymentPlatform;
      },
    }),
    createdAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (root) => {
        return root.purchaseOrder.createdAt;
      },
    }),
    tickets: t.field({
      type: [UserTicketRef],
      resolve: async (root, s, { DB }) => {
        const userTickets = await DB.query.userTicketsSchema.findMany({
          where: (ut, { eq, and }) =>
            and(eq(ut.purchaseOrderId, root.purchaseOrder.id)),
        });

        return userTickets.map((ut) => selectUserTicketsSchema.parse(ut));
      },
    }),
  }),
});
