import { builder } from "~/builder";
import { selectPurchaseOrdersSchema } from "~/datasources/db/purchaseOrders";
import {
  createPaginationInputType,
  createPaginationObjectType,
} from "~/schema/pagination/types";
import { purchaseOrderFetcher } from "~/schema/purchaseOrder/purchaseOrderFetcher";

import { PurchaseOrderRef } from "./types";

const MyPurchaseOrdersInput = builder.inputType("MyPurchaseOrdersInput", {
  fields: (t) => ({
    paymentPlatform: t.field({
      type: "String",
      required: false,
    }),
  }),
});

const PaginatedPurchaseOrderRef = createPaginationObjectType(PurchaseOrderRef);

builder.queryField("myPurchaseOrders", (t) =>
  t.field({
    description: "Get a list of purchase orders for the authenticated user",
    type: PaginatedPurchaseOrderRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: createPaginationInputType(t, MyPurchaseOrdersInput),
    resolve: async (root, { input }, { DB, USER }) => {
      if (!USER) {
        throw new Error("User is required");
      }

      const { data, pagination } =
        await purchaseOrderFetcher.searchPaginatedPurchaseOrders({
          DB,
          search: {
            userIds: [USER.id],
            paymentPlatform: input.search?.paymentPlatform
              ? ([input.search?.paymentPlatform] as ["stripe" | "mercadopago"])
              : undefined,
          },
          pagination: input.pagination,
        });

      return {
        data: data.map((po) => {
          return {
            purchaseOrder: selectPurchaseOrdersSchema.parse(po),
            ticketsIds: [],
          };
        }),
        pagination,
      };
    },
  }),
);
