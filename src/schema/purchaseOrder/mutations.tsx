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
        type: PayForPurchaseOrderInput,
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
        with: {
          user: true,
        },
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
      if (
        purchaseOrder.purchaseOrderPaymentStatus === "not_required" &&
        purchaseOrder.status !== "active"
      ) {
        throw new GraphQLError("Purchase order payment not required");
      }

      // TODO: Depending on the currency ID, we update the totalPrice for the
      // purchase order.
      const query = await fetchPurchaseOrderInformation(purchaseOrderId, DB);

      let totalAmount = 0;
      let allTicketsAreFree = true;
      for (const ticket of query) {
        if (!ticket.ticketTemplate.isFree) {
          allTicketsAreFree = false;
        }
        for (const ticketPrice of ticket.ticketTemplate.ticketsPrices) {
          totalAmount = ticketPrice.price.price_in_cents ?? 0;
        }
      }

      if (allTicketsAreFree && totalAmount !== 0) {
        throw new GraphQLError(
          "Purchase order payment not required, but total amount is not zero. This should not happen",
        );
      }
      if (!allTicketsAreFree && totalAmount === 0) {
        throw new GraphQLError(
          "Purchase order payment required, but total amount is zero. This should not happen",
        );
      }
      if (allTicketsAreFree) {
        console.log(
          "Purchase order payment not required, meaning all tickets are free, updating purchase order to reflect that",
        );
        const updatedPOs = await DB.update(purchaseOrdersSchema)
          .set({
            purchaseOrderPaymentStatus: "not_required",
            status: "active",
          })
          .where(eq(purchaseOrdersSchema.id, purchaseOrderId))
          .returning();
        const updatedPO = updatedPOs[0];
        if (!updatedPO) {
          throw new GraphQLError("Purchase order not found");
        }
        await DB.update(userTicketsSchema).set({
          status: "active",
          paymentStatus: "not_required",
        });

        const userTickets = await DB.query.userTicketsSchema.findMany({
          where: (t, { eq }) => eq(t.purchaseOrderId, purchaseOrderId),
        });

        const userTicketsIds = userTickets.map((t) => t.id);

        const information = await DB.query.purchaseOrdersSchema.findFirst({
          where: (po, { eq }) => eq(po.id, purchaseOrderId),
          with: {
            user: true,
            userTickets: {
              with: {
                event: {
                  with: {
                    eventsToCommunities: {
                      with: {
                        community: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        const eventInfo = information?.userTickets[0].event;
        if (!eventInfo) {
          console.error("Event not found");
        }
        const communityInfo = eventInfo?.eventsToCommunities[0].community;
        if (!communityInfo) {
          console.error("Community not found");
        }
        if (communityInfo && eventInfo) {
          await sendTransactionalHTMLEmail({
            htmlContent: render(
              <PurchaseOrderSuccessful
                purchaseOrderId={purchaseOrderId}
                community={{
                  name: communityInfo.name,
                  // communityURL: "https://cdn.com",
                  logoURL: communityInfo.logoImageSanityRef,
                }}
                eventName={eventInfo.name}
                place={{
                  name: eventInfo.addressDescriptiveName,
                  address: eventInfo.address,
                }}
                date={{
                  start: eventInfo.startDateTime,
                  end: eventInfo.endDateTime,
                }}
              />,
            ),
            to: [
              {
                name: purchaseOrder.user.name ?? purchaseOrder.user.username,
                email: purchaseOrder.user.email,
              },
            ],
            from: {
              name: "CommunityOS",
            },
            subject: "Tus tickets están listos 🎉",
          });
        }

        console.log(`Email sent to ${purchaseOrder.user.email}`);
        return {
          purchaseOrder: selectPurchaseOrdersSchema.parse(updatedPO),
          ticketsIds: userTicketsIds,
        };
        // TODO: Update purchase order to "auto-pay" or not be required.
      }

      await DB.transaction(async (trx) => {
        console.log("Purchase order requires payment");
        // 1. We ensure that products are created in the database.
        for (const ticket of query) {
          for (const ticketPrice of ticket.ticketTemplate.ticketsPrices) {
            console.log("🚨", ticketPrice.price.price_in_cents);
            if (!ticketPrice.price.currency) {
              throw new Error("Currency not found");
            }
            try {
              await ensureProductsAreCreated({
                price: ticketPrice.price.price_in_cents,
                currencyCode: ticketPrice.price.currency.currency,
                ticket: ticket.ticketTemplate,
                getStripeClient: GET_STRIPE_CLIENT,
                transactionHander: trx,
              });
            } catch (error) {
              console.error("Could not create product", error);
            }
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
      const items: Array<{ price: string; quantity: number }> = [];
      for (const ticketGroup of Object.values(ticketsGroupedByTemplateId)) {
        if (!ticketGroup.stripeId) {
          throw new Error(
            `Stripe Product ID not found for ticket ${ticketGroup.templateId}`,
          );
        }
        items.push({
          price: ticketGroup.stripeId,
          quantity: ticketGroup.quantity,
        });
      }

      console.log("🚨 Attempting to create payment on platform");
      console.log(items, purchaseOrderId);
      // 2. We create a payment link on stripe.
      const paymentLink = await createPayment({
        items,
        purchaseOrderId,
        getStripeClient: GET_STRIPE_CLIENT,
      });

      // 3. We update the purchase order with the payment link, and the total
      //    price and status
      if (!paymentLink.amount_total) {
        throw new Error("Amount total not found");
      }
      console.log("🚨 paymentLink", paymentLink);
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

      // 4. We return the payment link.
      return {
        purchaseOrder: selectPurchaseOrdersSchema.parse(updatedPurchaseOrder),
        ticketsIds: userTickets.map((t) => t.id),
      };
    },
  }),
);
