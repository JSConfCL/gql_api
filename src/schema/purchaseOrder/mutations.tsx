import { render } from "@react-email/components";
import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import React from "react";

import { PurchaseOrderSuccessful } from "emails/templates/tickets/purchase-order-successful";
import { builder } from "~/builder";
import { ORM_TYPE } from "~/datasources/db";
import {
  purchaseOrdersSchema,
  selectPurchaseOrdersSchema,
  userTicketsSchema,
} from "~/datasources/db/schema";
import { sendTransactionalHTMLEmail } from "~/datasources/email/sendEmailToWorkers";
import { createPayment } from "~/datasources/stripe";
import { ensureProductsAreCreated } from "~/schema/ticket/helpers";

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
