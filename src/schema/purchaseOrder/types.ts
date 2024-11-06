import { builder } from "~/builder";
import {
  selectPurchaseOrdersSchema,
  puchaseOrderPaymentStatusEnum,
  purchaseOrderStatusEnum,
  SelectUserTicketAddonSchema,
  SelectUserTicketSchema,
  SelectPurchaseOrderSchema,
} from "~/datasources/db/schema";
import { UserTicketRef } from "~/schema/shared/refs";

import { AllowedCurrencyLoadable } from "../allowedCurrency/types";
import { UserTicketAddonRef } from "../ticketAddons/types";

export const PurchaseOrderPaymentStatusEnum = builder.enumType(
  "PurchaseOrderPaymentStatusEnum",
  {
    values: puchaseOrderPaymentStatusEnum,
  },
);

const PurchaseOrderStatusEnum = builder.enumType("PurchaseOrderStatusEnum", {
  values: purchaseOrderStatusEnum,
});

export const PurchaseOrderRef =
  builder.objectRef<SelectPurchaseOrderSchema>("PurchaseOrder");

export const PurchaseOrderLoadable = builder.loadableObject(PurchaseOrderRef, {
  description: "Representation of a Purchase Order",
  load: async (ids: string[], context) => {
    const result = await context.DB.query.purchaseOrdersSchema.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
    });

    const resultByIdMap = new Map(
      result.map((item) => [item.id, selectPurchaseOrdersSchema.parse(item)]),
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
      resolve: (root) => root.id,
    }),
    finalPrice: t.field({
      type: "Float",
      nullable: true,
      resolve: (root) => {
        return root.totalPrice ? parseFloat(root.totalPrice) : null;
      },
    }),
    paymentLink: t.field({
      type: "String",
      nullable: true,
      resolve: (root) => {
        return root.paymentPlatformPaymentLink;
      },
    }),
    currency: t.field({
      type: AllowedCurrencyLoadable,
      nullable: true,
      resolve: (root) => root.currencyId,
    }),
    purchasePaymentStatus: t.field({
      type: PurchaseOrderPaymentStatusEnum,
      nullable: true,
      resolve: (root) => {
        return root.purchaseOrderPaymentStatus;
      },
    }),
    status: t.field({
      type: PurchaseOrderStatusEnum,
      nullable: true,
      resolve: (root) => {
        return root.status;
      },
    }),
    paymentPlatform: t.field({
      type: "String",
      nullable: true,
      resolve: (root) => {
        return root.paymentPlatform;
      },
    }),
    createdAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (root) => {
        return root.createdAt;
      },
    }),
    publicId: t.field({
      type: "String",
      nullable: true,
      resolve: (root) => {
        return root.publicId;
      },
    }),
    tickets: t.loadableList({
      type: UserTicketRef,
      load: async (ids: string[], { DB }) => {
        const userTicketsByPurchaseOrderIdMap: Record<
          string,
          SelectUserTicketSchema[] | undefined
        > = {};

        const userTickets = await DB.query.userTicketsSchema.findMany({
          where: (ut, ops) => ops.inArray(ut.purchaseOrderId, ids),
        });

        userTickets.forEach((ut) => {
          if (!userTicketsByPurchaseOrderIdMap[ut.purchaseOrderId]) {
            userTicketsByPurchaseOrderIdMap[ut.purchaseOrderId] = [];
          }

          userTicketsByPurchaseOrderIdMap[ut.purchaseOrderId]?.push(ut);
        });

        return ids.map((id) => userTicketsByPurchaseOrderIdMap[id] || []);
      },
      resolve: (root) => root.id,
    }),
    userTicketAddons: t.loadableList({
      type: UserTicketAddonRef,
      load: async (ids: string[], { DB }) => {
        const userTicketAddonsByPurchaseOrderIdMap: Record<
          string,
          SelectUserTicketAddonSchema[] | undefined
        > = {};

        const userTicketAddons = await DB.query.userTicketAddonsSchema.findMany(
          {
            where: (uat, ops) => {
              return ops.inArray(uat.purchaseOrderId, ids);
            },
          },
        );

        userTicketAddons.forEach((uat) => {
          if (!userTicketAddonsByPurchaseOrderIdMap[uat.purchaseOrderId]) {
            userTicketAddonsByPurchaseOrderIdMap[uat.purchaseOrderId] = [];
          }

          userTicketAddonsByPurchaseOrderIdMap[uat.purchaseOrderId]?.push(uat);
        });

        return ids.map((id) => userTicketAddonsByPurchaseOrderIdMap[id] || []);
      },
      resolve: (root) => root.id,
    }),
  }),
});
