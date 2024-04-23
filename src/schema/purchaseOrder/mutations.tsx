import { builder } from "~/builder";

import { createPaymentIntent, syncPurchaseOrderPaymentStatus } from "./actions";
import { PurchaseOrderRef } from "./types";
import { authHelpers } from "../../authz/helpers";
import { selectPurchaseOrdersSchema } from "../../datasources/db/purchaseOrders";

const PayForPurchaseOrderInput = builder.inputType("PayForPurchaseOrderInput", {
  fields: (t) => ({
    purchaseOrderId: t.field({
      type: "String",
      required: true,
    }),
    currencyID: t.field({
      type: "String",
      required: true,
    }),
  }),
});

builder.mutationField("payForPurchaseOrder", (t) =>
  t.field({
    description: "Create a purchase order",
    type: PurchaseOrderRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({
        type: PayForPurchaseOrderInput,
        required: true,
      }),
    },
    resolve: async (
      parent,
      { input },
      { DB, GET_STRIPE_CLIENT, USER, PURCHASE_CALLBACK_URL },
    ) => {
      if (!USER) {
        throw new Error("User is required");
      }
      const { purchaseOrderId } = input;

      const { purchaseOrder, ticketsIds } = await createPaymentIntent({
        DB,
        USER,
        purchaseOrderId,
        GET_STRIPE_CLIENT,
        PURCHASE_CALLBACK_URL,
      });

      // 4. We return the payment link.
      return {
        purchaseOrder,
        ticketsIds,
      };
    },
  }),
);

const CheckForPurchaseOrderInput = builder.inputType(
  "CheckForPurchaseOrderInput",
  {
    fields: (t) => ({
      purchaseOrderId: t.field({
        type: "String",
        required: true,
      }),
    }),
  },
);

builder.mutationField("checkPurchaseOrderStatus", (t) =>
  t.field({
    description: "Check the status of a purchase order",
    type: PurchaseOrderRef,
    // authz: {
    //   rules: ["IsAuthenticated"],
    // },
    args: {
      input: t.arg({
        type: CheckForPurchaseOrderInput,
        required: true,
      }),
    },
    resolve: async (parent, { input }, { DB, GET_STRIPE_CLIENT, USER }) => {
      if (!USER) {
        throw new Error("User is required");
      }
      const { purchaseOrderId } = input;
      const isOwner = await authHelpers.isOwnerOfPurchaseOrder({
        user: USER,
        purchaseOrderId,
        DB,
      });
      console.log("isOwner", isOwner);
      if (!isOwner) {
        throw new Error("User is not the owner of the purchase order");
      }
      const purchaseOrder = await syncPurchaseOrderPaymentStatus({
        DB,
        GET_STRIPE_CLIENT,
        purchaseOrderId,
      });

      const tickets = await DB.query.userTicketsSchema.findMany({
        where: (po, { eq }) => eq(po.purchaseOrderId, purchaseOrderId),
        columns: {
          id: true,
        },
      });

      if (!purchaseOrder) {
        throw new Error("Purchase order not found");
      }

      const ticketsIds = tickets.map((t) => t.id);

      return {
        purchaseOrder: selectPurchaseOrdersSchema.parse(purchaseOrder),
        ticketsIds,
      };
    },
  }),
);
