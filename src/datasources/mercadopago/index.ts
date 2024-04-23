import { MercadoPagoConfig, Preference } from "mercadopago";
import { Items } from "mercadopago/dist/clients/commonTypes";

import {
  puchaseOrderPaymentStatusEnum,
  purchaseOrderStatusEnum,
} from "~/datasources/db/schema";
import {
  someMinutesIntoTheFuture,
  toISOStringWithTimezone,
} from "~/datasources/helpers";

// export const getPaymentStatusFromStripeSession = (
//   stripeStatus: Stripe.Response<Stripe.Checkout.Session>["payment_status"],
// ): (typeof puchaseOrderPaymentStatusEnum)[number] => {
//   if (stripeStatus === "paid") {
//     return "paid";
//   } else if (stripeStatus === "no_payment_required") {
//     return "not_required";
//   } else if (stripeStatus === "unpaid") {
//     return "unpaid";
//   }
//   throw new Error("Unknown payment status", stripeStatus);
// };

// export const getStatusFromStripeSession = (
//   stripeStatus: Stripe.Response<Stripe.Checkout.Session>["status"],
// ): (typeof purchaseOrderStatusEnum)[number] => {
//   if (stripeStatus === "complete") {
//     return "complete";
//   } else if (stripeStatus === "expired") {
//     return "expired";
//   } else if (stripeStatus === "open") {
//     return "open";
//   } else if (stripeStatus === null) {
//     return "open";
//   }
//   throw new Error("Unknown purchase order status", stripeStatus);
// };

// const isIntegerLike = (numberInCents: number) => numberInCents % 100 === 0;
// const getUnitAmount = (unitAmount: number) => {
//   if (isIntegerLike(unitAmount)) {
//     return { unit_amount: unitAmount };
//   }
//   return { unit_amount_decimal: unitAmount.toString() };
// };

export const createMercadoPagoPayment = async ({
  items,
  user,
  purchaseOrderId,
  getMercadoPagoClient,
  PURCHASE_CALLBACK_URL,
  eventId,
}: {
  items: Array<Items>;
  user: {
    email: string;
    id: string;
  };
  purchaseOrderId: string;
  getMercadoPagoClient: () => MercadoPagoConfig;
  PURCHASE_CALLBACK_URL: string;
  eventId: string;
}) => {
  const mercadoPagoClient = getMercadoPagoClient();
  const expirationDate = someMinutesIntoTheFuture(31);
  const expirationDateWithTimeZone = toISOStringWithTimezone(expirationDate);
  const preferenceApi = new Preference(mercadoPagoClient);
  const preference = await preferenceApi.create({
    body: {
      // transaction_amount
      // description: "",
      // payment_method_id:
      payer: {
        email: user.email,
      },
      items: items,
      back_urls: {
        success: `${PURCHASE_CALLBACK_URL}?purchaseOrderId=${purchaseOrderId}&status=approved`,
        failure: `${PURCHASE_CALLBACK_URL}?purchaseOrderId=${purchaseOrderId}&status=rejected`,
        pending: `${PURCHASE_CALLBACK_URL}?purchaseOrderId=${purchaseOrderId}&status=pending`,
      },
      binary_mode: true,
      auto_return: "all",
      external_reference: purchaseOrderId,
      date_of_expiration: expirationDateWithTimeZone,
      metadata: {
        eventId,
      },
    },
    // requestOptions: {},
  });
  // const paymentLink = await stripeClient.checkout.sessions.create({
  //   // The URL to which Stripe should send customers when payment or setup is
  //   // complete. If you’d like to use information from the successful Checkout
  //   // Session on your page, read the guide on customizing your success page.
  //   // https://stripe.com/docs/payments/checkout/custom-success-page
  //   success_url: `${PURCHASE_CALLBACK_URL}?session_id={CHECKOUT_SESSION_ID}&purchaseOrderId=${purchaseOrderId}`,
  //   // The URL the customer will be directed to if they decide to cancel
  //   // payment and return to your website.
  //   // cancel_url: `https://jsconf.cl/tickets`,
  //   // A list of items the customer is purchasing. Use this parameter to pass
  //   // one-time or recurring Prices.
  //   // For payment mode, there is a maximum of 100 line items, however it is
  //   // recommended to consolidate line items if there are more than a few dozen.
  //   // line_items: items,
  //   line_items: items,
  //   // A unique string to reference the Checkout Session. This can be a
  //   // customer ID, a cart ID, or similar, and can be used to reconcile the
  //   // session with your internal systems.
  //   client_reference_id: purchaseOrderId,
  //   // The Epoch time in seconds at which the Checkout Session will expire. It
  //   // can be anywhere from 30 minutes to 24 hours after Checkout Session
  //   // creation. By default, this value is 24 hours from creation.
  //   // El link expira en 31 minutos
  //   expires_at: expirationDateInEpoch,
  //   mode: "payment",
  // });

  return {
    preference,
    expirationDate: new Date(expirationDate).toISOString(),
  };
};

// export const getStripePaymentStatus = async ({
//   paymentId,
//   getStripeClient,
// }: {
//   paymentId: string;
//   getStripeClient: () => Stripe;
// }) => {
//   const stripeClient = getStripeClient();
//   const payment = await stripeClient.checkout.sessions.retrieve(paymentId);
//   if (!payment) {
//     throw new Error(`Payment not found for id: ${paymentId}`);
//   }
//   return {
//     paymentStatus: getPaymentStatusFromStripeSession(payment.payment_status),
//     status: getStatusFromStripeSession(payment.status),
//   };
// };
