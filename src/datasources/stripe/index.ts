import Stripe from "stripe";

import { puchaseOrderPaymentStatusEnum } from "../db/purchaseOrders";
import { someMinutesIntoTheFuture } from "../helpers";

const getPaymentStatusFromPaymentProviderStatus = (
  stripeStatus: Stripe.Response<Stripe.Checkout.Session>["status"],
): (typeof puchaseOrderPaymentStatusEnum)[number] => {
  if (stripeStatus === "complete") {
    return "paid";
  } else if (stripeStatus === "expired") {
    return "cancelled";
  } else if (stripeStatus === "open") {
    return "unpaid";
  }
  return "unpaid";
};

const isInteger = (n: number) => n % 1 === 0;

export const createStripeProduct = async ({
  item,
  getStripClient,
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
  getStripClient: () => Stripe;
}) => {
  const stripeClient = getStripClient();
  // check if a number is a float or an integrer
  const productData = await stripeClient.products.create({
    id: item.id,
    name: item.name,
    active: true, // TODO: Adda way to disable tickets based on ticket status.
    description: item.description,
    metadata: item.metadata,
    default_price_data: {
      currency: item.currency,
      // Stripe expects the unit_amount to be an integer, and unit_amount_decimal to be a float
      // if we want to use decimals. (sellin 29.99 USD), we need to use unit_amount_decimal
      // instead of unit_amount.
      ...(isInteger(item.unit_amount)
        ? { unit_amount: item.unit_amount }
        : { unit_amount_decimal: item.unit_amount.toString() }),
    },
    shippable: false,
  });

  return productData;
};

export const createPayment = async ({
  items,
  purchaseOrderId,
  getStripClient,
}: {
  items: Array<{
    id: string;
    price_data: {
      currency: string;
      product_data: {
        description?: string;
        name: string;
        metadata?: {
          [name: string]: string | number | null;
        };
      };
      unit_amount: number;
    };
    quantity: number;
  }>;
  purchaseOrderId: string;
  getStripClient: () => Stripe;
}) => {
  const stripeClient = getStripClient();
  const exirationDate = someMinutesIntoTheFuture(31);
  const expirationDateInEpoch = Math.round(exirationDate.getTime() / 1000);
  const paymentLink = await stripeClient.checkout.sessions.create({
    // The URL to which Stripe should send customers when payment or setup is
    // complete. If you’d like to use information from the successful Checkout
    // Session on your page, read the guide on customizing your success page.
    // https://stripe.com/docs/payments/checkout/custom-success-page
    // success_url: `${process.env.STRIPE_API_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}&paymentId=${paymentId}`,
    // The URL the customer will be directed to if they decide to cancel
    // payment and return to your website.
    // cancel_url: `https://jsconf.cl/tickets`,
    // A list of items the customer is purchasing. Use this parameter to pass
    // one-time or recurring Prices.
    // For payment mode, there is a maximum of 100 line items, however it is
    // recommended to consolidate line items if there are more than a few dozen.
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

  return {
    id: paymentLink.id,
    paymentUrl: paymentLink.url,
  };
};
