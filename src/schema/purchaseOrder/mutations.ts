import { eq } from "drizzle-orm";

import { builder } from "~/builder";
import {
  insertSalariesSchema,
  purchaseOrderPaymentPlatforms,
  purchaseOrdersSchema,
  salariesSchema,
  selectSalariesSchema,
} from "~/datasources/db/schema";
import { GenderEnum } from "~/schema/shared/enums";
import { SalaryRef } from "~/schema/shared/refs";

const PurchaseOrderPlatformEnum = builder.enumType(
  "PurchaseOrderPlatformEnum",
  {
    values: purchaseOrderPaymentPlatforms,
  },
);

const PurchaseFlowForPurchaseOrderInput = builder.inputType(
  "PurchaseFlowForPurchaseOrderInput",
  {
    fields: (t) => ({
      purchaseOrderId: t.field({
        type: "String",
        required: true,
      }),
      paymentPlatform: t.field({
        type: PurchaseOrderPlatformEnum,
        required: true,
      }),
      currencyID: t.field({
        type: "String",
        required: true,
      }),
    }),
  },
);

builder.mutationFields((t) => ({
  initializePurchaseFlowForPurchaseOrder: t.field({
    description: "Create a salary",
    type: SalaryRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({
        type: PurchaseFlowForPurchaseOrderInput,
        required: true,
      }),
    },
    resolve: async (parent, { input }, { DB, USER }) => {
      if (!USER) {
        throw new Error("User is required");
      }
      const { paymentPlatform, purchaseOrderId } = input;

      const purchaseOrder = await DB.query.purchaseOrdersSchema.findFirst({
        where: (po, { eq }) => eq(po.id, purchaseOrderId),
      });

      if (!purchaseOrder) {
        throw new Error("Purchase order not found");
      }
      if (purchaseOrder.userId !== USER.id) {
        throw new Error("Unauthorized");
      }
      if (purchaseOrder.purchaseOrderPaymentStatus === "paid") {
        throw new Error("Purchase order already paid");
      }
      if (purchaseOrder.purchaseOrderPaymentStatus === "not_required") {
        throw new Error("Purchase order payment not required");
      }

      // TODO: Depending on the currency ID, we update the totalPrice for the purchase order.
      const query = await DB.query.userTicketsSchema.findMany({
        where: (t, { eq }) => eq(t.purchaseOrderId, purchaseOrderId),
        with: {
          ticketTemplate: {
            with: {
              ticketsPrices: {
                with: {
                  price: {
                    with: {
                      currency: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      let totalAmount = 0;
      for (const ticket of query) {
        for (const ticketPrice of ticket.ticketTemplate.ticketsPrices) {
          totalAmount = ticketPrice.price.price ?? 0;
        }
      }

      console.log("🚨", totalAmount);
      // if 0, throw error
      // if not 0, update purchase order total price
      // - create purchase order/payment link on stripe.
      // - add it to PO.
      // - Construct response and return payment link.
    },
  }),
}));
