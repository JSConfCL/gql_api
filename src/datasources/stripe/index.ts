import Stripe from "stripe";

import { puchaseOrderPaymentStatusEnum } from "~/datasources/db/purchaseOrders";
import { someMinutesIntoTheFuture } from "~/datasources/helpers";

export const getPaymentStatusFromPaymentProviderStatus = (
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
const getUnitAmount = (unitAmount: number) => {
  if (isInteger(unitAmount)) {
    return { unit_amount: unitAmount };
  }
  return { unit_amount_decimal: unitAmount.toString() };
};

export const createStripeProductAndPrice = async ({
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
};

export const createPayment = async ({
  items,
  purchaseOrderId,
  getStripeClient,
}: {
  items: Array<{
    id: string;
    quantity: number;
  }>;
  purchaseOrderId: string;
  getStripeClient: () => Stripe;
}) => {
  const stripeClient = getStripeClient();
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
