import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import { ORM_TYPE } from "~/datasources/db";
import {
  purchaseOrderPaymentPlatforms,
  purchaseOrdersSchema,
  selectPurchaseOrdersSchema,
} from "~/datasources/db/schema";
import { createPayment } from "~/datasources/stripe";
import { ensureProductsAreCreated } from "~/schema/ticket/helpers";

import { PurchaseOrderRef } from "./types";

const PurchaseFlowForPurchaseOrderInput = builder.inputType(
  "PurchaseFlowForPurchaseOrderInput",
  {
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
  },
);

const fetchPurchaseOrderInformation = async (
  purchaseOrderId: string,
  DB: ORM_TYPE,
) => {
  return await DB.query.userTicketsSchema.findMany({
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
};

builder.mutationField("payForPurchaseOrder", (t) =>
  t.field({
    description: "Create a purchase order",
    type: PurchaseOrderRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({
        type: PurchaseFlowForPurchaseOrderInput,
        required: true,
      }),
    },
    resolve: async (parent, { input }, { DB, GET_STRIPE_CLIENT, USER }) => {
      if (!USER) {
        throw new Error("User is required");
      }
      const { purchaseOrderId } = input;

      const purchaseOrder = await DB.query.purchaseOrdersSchema.findFirst({
        where: (po, { eq, and }) =>
          and(eq(po.id, purchaseOrderId), eq(po.userId, USER.id)),
      });

      if (!purchaseOrder) {
        throw new GraphQLError("Purchase order not found");
      }
      if (purchaseOrder.userId !== USER.id) {
        throw new GraphQLError("Unauthorized");
      }
      if (purchaseOrder.purchaseOrderPaymentStatus === "paid") {
        throw new GraphQLError("Purchase order already paid");
      }
      if (purchaseOrder.purchaseOrderPaymentStatus === "not_required") {
        throw new GraphQLError("Purchase order payment not required");
      }

      // TODO: Depending on the currency ID, we update the totalPrice for the purchase order.
      const query = await fetchPurchaseOrderInformation(purchaseOrderId, DB);

      let totalAmount = 0;
      let requiresPayment = false;
      for (const ticket of query) {
        if (!ticket.ticketTemplate.isFree) {
          requiresPayment = true;
        }
        for (const ticketPrice of ticket.ticketTemplate.ticketsPrices) {
          totalAmount = ticketPrice.price.price ?? 0;
        }
      }

      console.log("🚨", totalAmount);
      if (!requiresPayment) {
        console.log(
          "Purchase order payment not required, meaning all tickets are free, updating purchase order to reflect that",
        );
        // TODO: Update purchase order to "auto-pay" or not be required.
      }
      if (totalAmount === 0) {
        console.error(
          "This should not happen, total amount is 0, but requires payment. This is a bug.",
        );
        throw new GraphQLError("Total amount is 0, but PO requires payment");
      }
      await DB.transaction(async (trx) => {
        console.log("Purchase order requires payment");
        // 1. We ensure that products are created in the database.
        for (const ticket of query) {
          for (const ticketPrice of ticket.ticketTemplate.ticketsPrices) {
            console.log("🚨", ticketPrice.price.price);
            if (!ticketPrice.price.currency) {
              throw new Error("Currency not found");
            }
            await ensureProductsAreCreated({
              price: ticketPrice.price.price,
              currencyCode: ticketPrice.price.currency.currency,
              ticket: ticket.ticketTemplate,
              getStripeClient: GET_STRIPE_CLIENT,
              transactionHander: trx,
            });
          }
        }
      });

      const userTickets = await DB.query.userTicketsSchema.findMany({
        where: (t, { eq }) => eq(t.purchaseOrderId, purchaseOrderId),
        with: {
          ticketTemplate: true,
        },
      });

      const ticketsGroupedByTemplateId: Record<
        string,
        {
          templateId: string;
          quantity: number;
          stripeId: string | null;
        }
      > = {};

      for (const ticket of userTickets) {
        if (!ticketsGroupedByTemplateId[ticket.ticketTemplate.id]) {
          ticketsGroupedByTemplateId[ticket.ticketTemplate.id] = {
            templateId: ticket.ticketTemplate.id,
            quantity: 0,
            stripeId: ticket.ticketTemplate.stripeProductId,
          };
        }
        ticketsGroupedByTemplateId[ticket.ticketTemplate.id].quantity += 1;
      }
      const items: Array<{ id: string; quantity: number }> = [];
      for (const ticketGroup of Object.values(ticketsGroupedByTemplateId)) {
        if (!ticketGroup.stripeId) {
          throw new Error(
            `Stripe Product ID not found for ticket ${ticketGroup.templateId}`,
          );
        }
        items.push({
          id: ticketGroup.stripeId,
          quantity: ticketGroup.quantity,
        });
      }

      // 2. We create a payment link on stripe.
      const paymentLink = await createPayment({
        items,
        purchaseOrderId,
        getStripeClient: GET_STRIPE_CLIENT,
      });

      // 3. We update the purchase order with the payment link, and the total price and status
      if (!paymentLink.amount_total) {
        throw new Error("Amount total not found");
      }
      const updatedPurchaseOrders = await DB.update(purchaseOrdersSchema)
        .set({
          totalPrice: paymentLink.amount_total.toString(),
          paymentPlatform: "stripe",
          // paymentPlatformExpirationDate: new Date(paymentLink.expires_at),
          paymentPlatformPaymentLink: paymentLink.url,
          paymentPlatformReferenceID: paymentLink.id,
          paymentPlatformStatus: paymentLink.status,
          purchaseOrderPaymentStatus: "unpaid",
          status: "active",
          paymentPlatformExpirationDate: new Date(
            paymentLink.expires_at,
          ).toISOString(),
        })
        .where(eq(purchaseOrdersSchema.id, purchaseOrderId))
        .returning();
      const updatedPurchaseOrder = updatedPurchaseOrders[0];
      if (!updatedPurchaseOrder) {
        throw new Error("Purchase order not found");
      }

      return {
        purchaseOrder: selectPurchaseOrdersSchema.parse(updatedPurchaseOrder),
        ticketsIds: userTickets.map((t) => t.id),
      };

      // 4. We return the payment link.

      // if 0, throw error
      // if not 0, update purchase order total price
      // - create purchase order/payment link on stripe.
      // - add it to PO.
      // - Construct response and return payment link.
    },
  }),
);
