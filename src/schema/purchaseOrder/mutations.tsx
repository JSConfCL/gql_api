import { authHelpers } from "~/authz/helpers";
import { builder } from "~/builder";
import { selectPurchaseOrdersSchema } from "~/datasources/db/purchaseOrders";
import { getPurchaseRedirectURLsFromPurchaseOrder } from "~/schema/purchaseOrder/helpers";

import {
  handlePaymentLinkGeneration,
  syncPurchaseOrderPaymentStatus,
} from "./actions";
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
    resolve: async (
      parent,
      { input },
      {
        DB,
        GET_STRIPE_CLIENT,
        USER,
        PURCHASE_CALLBACK_URL,
        GET_MERCADOPAGO_CLIENT,
        logger,
      },
    ) => {
      if (!USER) {
        throw new Error("User is required");
      }

      const { purchaseOrderId, currencyID } = input;

      const { paymentCancelRedirectURL, paymentSuccessRedirectURL } =
        await getPurchaseRedirectURLsFromPurchaseOrder({
          DB,
          default_redirect_url: PURCHASE_CALLBACK_URL,
          purchaseOrderId,
        });
      const { purchaseOrder, ticketsIds } = await handlePaymentLinkGeneration({
        DB,
        USER,
        purchaseOrderId,
        GET_STRIPE_CLIENT,
        paymentCancelRedirectURL,
        paymentSuccessRedirectURL,
        GET_MERCADOPAGO_CLIENT,
        currencyId: currencyID,
        logger,
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
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({
        type: CheckForPurchaseOrderInput,
        required: true,
      }),
    },
    resolve: async (
      parent,
      { input },
      {
        DB,
        GET_STRIPE_CLIENT,
        GET_MERCADOPAGO_CLIENT,
        USER,
        logger,
        RPC_SERVICE_EMAIL,
      },
    ) => {
      if (!USER) {
        throw new Error("User is required");
      }

      const { purchaseOrderId } = input;
      const isOwner = await authHelpers.isOwnerOfPurchaseOrder({
        user: USER,
        purchaseOrderId,
        DB,
      });

      if (!isOwner) {
        throw new Error("User is not the owner of the purchase order");
      }

      const purchaseOrder = await syncPurchaseOrderPaymentStatus({
        DB,
        purchaseOrderId,
        GET_STRIPE_CLIENT,
        GET_MERCADOPAGO_CLIENT,
        logger,
        transactionalEmailService: RPC_SERVICE_EMAIL,
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
