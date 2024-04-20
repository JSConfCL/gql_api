import { builder } from "~/builder";

import { createPaymentIntent } from "./actions";
import { PurchaseOrderRef } from "./types";

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
    resolve: async (parent, { input }, { DB, GET_STRIPE_CLIENT, USER }) => {
      if (!USER) {
        throw new Error("User is required");
      }
      const { purchaseOrderId } = input;

      const { purchaseOrder, ticketsIds } = await createPaymentIntent({
        DB,
        USER,
        purchaseOrderId,
        GET_STRIPE_CLIENT,
      });

      // 4. We return the payment link.
      return {
        purchaseOrder,
        ticketsIds,
      };
    },
  }),
);
