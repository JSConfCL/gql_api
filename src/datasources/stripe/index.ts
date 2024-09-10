import Stripe from "stripe";

import {
  puchaseOrderPaymentStatusEnum,
  purchaseOrderStatusEnum,
} from "~/datasources/db/schema";
import { someMinutesIntoTheFuture } from "~/datasources/helpers";

const getPaymentStatusFromStripeSession = (
  stripeStatus: Stripe.Response<Stripe.Checkout.Session>["payment_status"],
): (typeof puchaseOrderPaymentStatusEnum)[number] => {
  if (stripeStatus === "paid") {
    return "paid";
  } else if (stripeStatus === "no_payment_required") {
    return "not_required";
  } else if (stripeStatus === "unpaid") {
    return "unpaid";
  }

  throw new Error("Unknown payment status", stripeStatus);
};

const getPurchaseOrderStatusFromStripeSession = (
  stripeStatus: Stripe.Response<Stripe.Checkout.Session>["status"],
): (typeof purchaseOrderStatusEnum)[number] => {
  if (stripeStatus === "complete") {
    return "complete";
  } else if (stripeStatus === "expired") {
    return "expired";
  } else if (stripeStatus === "open") {
    return "open";
  } else if (stripeStatus === null) {
    return "open";
  }

  throw new Error("Unknown purchase order status", stripeStatus);
};

const isIntegerLike = (numberInCents: number) => numberInCents % 100 === 0;
const getUnitAmount = (unitAmount: number) => {
  if (isIntegerLike(unitAmount)) {
    return { unit_amount: unitAmount };
  }

  return { unit_amount_decimal: unitAmount.toString() };
};

export const createOrUpdateStripeProductAndPrice = async ({
  item,
  getStripeClient,
}: {
  item: {
    id: string;
    currency: string;
    name: string;
    description?: string;
    metadata?: {
      [name: string]: string | number | null;
    };
    unit_amount: number;
  };
  getStripeClient: () => Stripe;
}) => {
  const stripeClient = getStripeClient();

  try {
    // Try to retrieve the existing product
    const existingProduct = await stripeClient.products.retrieve(item.id);

    // If the product exists, update it
    if (existingProduct) {
      const updatedProduct = await stripeClient.products.update(item.id, {
        name: item.name,
        description: item.description,
        metadata: item.metadata,
      });

      // Check if we need to update the price
      const existingPrice = updatedProduct.default_price as Stripe.Price;

      if (
        existingPrice &&
        (existingPrice.currency !== item.currency ||
          existingPrice.unit_amount !== item.unit_amount * 100)
      ) {
        // Create a new price
        const newPrice = await stripeClient.prices.create({
          product: item.id,
          currency: item.currency,
          ...getUnitAmount(item.unit_amount),
        });

        // Update the product with the new default price
        await stripeClient.products.update(item.id, {
          default_price: newPrice.id,
        });

        return newPrice.id;
      }

      return existingPrice?.id;
    }
  } catch (error) {
    // If the product doesn't exist, create a new one
    if ((error as Stripe.errors.StripeError).code === "resource_missing") {
      const productData = await stripeClient.products.create({
        id: item.id,
        name: item.name,
        // TODO: Add a way to disable tickets based on ticket status.
        active: true,
        description: item.description,
        metadata: item.metadata,
        default_price_data: {
          currency: item.currency,
          // Stripe expects the unit_amount to be an integer, and unit_amount_decimal to be a float
          // if we want to use decimals. (sellin 29.99 USD), we need to use unit_amount_decimal
          // instead of unit_amount.
          ...getUnitAmount(item.unit_amount),
        },
        shippable: false,
      });

      const defaultPrice = productData.default_price;

      if (!defaultPrice) {
        throw new Error("Stripe product and price could not be created.");
      }

      if (typeof defaultPrice === "string") {
        return defaultPrice;
      }

      return defaultPrice.id;
    } else {
      throw error;
    }
  }
};

export const createStripePayment = async ({
  items,
  purchaseOrderId,
  getStripeClient,
  paymentSuccessRedirectURL,
  paymentCancelRedirectURL,
}: {
  items: Array<{
    price: string;
    quantity: number;
  }>;
  purchaseOrderId: string;
  getStripeClient: () => Stripe;
  paymentSuccessRedirectURL: string;
  paymentCancelRedirectURL: string;
}) => {
  const stripeClient = getStripeClient();
  const exirationDate = someMinutesIntoTheFuture(31);
  const expirationDateInEpoch = Math.round(exirationDate.getTime() / 1000);
  const paymentLink = await stripeClient.checkout.sessions.create({
    // The URL to which Stripe should send customers when payment or setup is
    // complete. If you’d like to use information from the successful Checkout
    // Session on your page, read the guide on customizing your success page.
    // https://stripe.com/docs/payments/checkout/custom-success-page
    success_url: `${paymentSuccessRedirectURL}?session_id={CHECKOUT_SESSION_ID}&purchaseOrderId=${purchaseOrderId}&status=approved`,
    cancel_url: `${paymentCancelRedirectURL}?session_id={CHECKOUT_SESSION_ID}&purchaseOrderId=${purchaseOrderId}&status=rejected`,
    // The URL the customer will be directed to if they decide to cancel
    // payment and return to your website.
    // cancel_url: `https://jsconf.cl/tickets`,
    // A list of items the customer is purchasing. Use this parameter to pass
    // one-time or recurring Prices.
    // For payment mode, there is a maximum of 100 line items, however it is
    // recommended to consolidate line items if there are more than a few dozen.
    // line_items: items,
    line_items: items,
    // A unique string to reference the Checkout Session. This can be a
    // customer ID, a cart ID, or similar, and can be used to reconcile the
    // session with your internal systems.
    client_reference_id: purchaseOrderId,
    // The Epoch time in seconds at which the Checkout Session will expire. It
    // can be anywhere from 30 minutes to 24 hours after Checkout Session
    // creation. By default, this value is 24 hours from creation.
    // El link expira en 31 minutos
    expires_at: expirationDateInEpoch,
    mode: "payment",
  });

  return paymentLink;
};

export const getStripePaymentStatus = async ({
  paymentId,
  getStripeClient,
}: {
  paymentId: string;
  getStripeClient: () => Stripe;
}) => {
  const stripeClient = getStripeClient();
  const payment = await stripeClient.checkout.sessions.retrieve(paymentId);

  if (!payment) {
    throw new Error(`Payment not found for id: ${paymentId}`);
  }

  return {
    paymentStatus: getPaymentStatusFromStripeSession(payment.payment_status),
    status: getPurchaseOrderStatusFromStripeSession(payment.status),
  };
};
