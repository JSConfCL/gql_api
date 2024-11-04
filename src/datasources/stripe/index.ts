import Stripe from "stripe";

import {
  PurchaseOrderPaymentStatus,
  PurchaseOrderStatus,
} from "~/datasources/db/schema";
import { someMinutesIntoTheFuture } from "~/datasources/helpers";
import { Logger } from "~/logging";

const getPaymentStatusFromStripeSession = (
  stripeStatus: Stripe.Response<Stripe.Checkout.Session>["payment_status"],
): PurchaseOrderPaymentStatus => {
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
): PurchaseOrderStatus => {
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

/**
 * Stripe expects the unit_amount to be an integer, and unit_amount_decimal to be a float
 * if we want to use decimals. (sellin 29.99 USD), we need to use unit_amount_decimal
 * instead of unit_amount.
 */
const getUnitAmount = (unitAmount: number) => {
  if (isIntegerLike(unitAmount)) {
    return { unit_amount: unitAmount };
  }

  return { unit_amount_decimal: unitAmount.toString() };
};

const STRIPE_RESOURCE_MISSING_ERROR = "resource_missing";

export type CreateOrUpdateStripeProductItem = {
  stripeId: string;
  currency: string;
  name: string;
  description?: string;
  unit_amount: number;
};

export const createOrUpdateStripeProductAndPrice = async ({
  item,
  getStripeClient,
}: {
  item: CreateOrUpdateStripeProductItem;
  getStripeClient: () => Stripe;
}): Promise<string> => {
  const stripeClient = getStripeClient();
  const updatedPriceData = {
    currency: item.currency,
    ...getUnitAmount(item.unit_amount),
  };

  const existingProduct = await retrieveExistingProduct(
    stripeClient,
    item.stripeId,
  );

  if (existingProduct) {
    const productNeedsUpdate =
      existingProduct.name !== item.name ||
      existingProduct.description !== item.description;

    if (productNeedsUpdate) {
      await stripeClient.products.update(item.stripeId, {
        name: item.name,
        description: item.description,
      });
    }

    const existingPrice = existingProduct.default_price;
    const priceHasChanged =
      !existingPrice ||
      existingPrice.currency.toLowerCase() !== item.currency.toLowerCase() ||
      (typeof updatedPriceData.unit_amount === "number" &&
        existingPrice.unit_amount !== updatedPriceData.unit_amount) ||
      (typeof updatedPriceData.unit_amount_decimal === "string" &&
        existingPrice.unit_amount_decimal !==
          updatedPriceData.unit_amount_decimal);

    if (priceHasChanged) {
      const newPrice = await stripeClient.prices.create({
        product: item.stripeId,
        ...updatedPriceData,
      });

      await stripeClient.products.update(item.stripeId, {
        default_price: newPrice.id,
      });

      return newPrice.id;
    }

    return existingPrice.id;
  } else {
    const productData = await stripeClient.products.create({
      id: item.stripeId,
      name: item.name,
      // TODO: Add a way to disable tickets based on ticket status.
      active: true,
      description: item.description,
      default_price_data: {
        ...updatedPriceData,
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
  }
};

type ExistingProduct = Omit<Stripe.Product, "default_price"> & {
  default_price: Stripe.Price | null;
};

async function retrieveExistingProduct(
  stripeClient: Stripe,
  productId: string,
) {
  try {
    const result = await stripeClient.products.retrieve(productId, {
      expand: ["default_price"],
    });

    if (typeof result.default_price === "string") {
      throw new Error("Stripe product price could not be retrieved.");
    }

    return result as ExistingProduct;
  } catch (error) {
    if (
      error instanceof Stripe.errors.StripeError &&
      error.code === STRIPE_RESOURCE_MISSING_ERROR
    ) {
      return null;
    }

    throw error;
  }
}

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
  logger,
}: {
  paymentId: string;
  getStripeClient: () => Stripe;
  logger: Logger;
}) => {
  const stripeClient = getStripeClient();
  const payment = await stripeClient.checkout.sessions.retrieve(paymentId);

  if (!payment) {
    logger.error(`Payment not found for id: ${paymentId}`);

    throw new Error(`Payment not found for id: ${paymentId}`);
  }

  logger.info(`Payment found for id: ${paymentId}`, {
    payment_status: payment.payment_status,
    status: payment.status,
  });

  return {
    paymentStatus: getPaymentStatusFromStripeSession(payment.payment_status),
    status: getPurchaseOrderStatusFromStripeSession(payment.status),
  };
};
