import { Items } from "mercadopago/dist/clients/commonTypes";
import { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";
import { PreferenceResponse } from "mercadopago/dist/clients/preference/commonTypes";
import { PreferenceCreateData } from "mercadopago/dist/clients/preference/create/types";

import {
  puchaseOrderPaymentStatusEnum,
  purchaseOrderStatusEnum,
} from "~/datasources/db/schema";
import {
  someMinutesIntoTheFuture,
  toISOStringWithTimezone,
} from "~/datasources/helpers";
import { Logger } from "~/logging";

const getPaymentStatusFromMercadoPago = (
  mercadoPagoStatus: PaymentResponse["status"],
): (typeof puchaseOrderPaymentStatusEnum)[number] => {
  const theStatus = mercadoPagoStatus?.toLowerCase();

  if (!theStatus) {
    return "unpaid";
  } else if (theStatus === "pending") {
    return "unpaid";
  } else if (theStatus === "inprocess") {
    return "unpaid";
  } else if (theStatus === "inmediation") {
    return "unpaid";
  } else if (theStatus === "cancelled") {
    return "unpaid";
  } else if (theStatus === "rejected") {
    return "unpaid";
  } else if (theStatus === "refunded") {
    return "unpaid";
  } else if (theStatus === "chargeback") {
    return "unpaid";
  } else if (theStatus === "approved") {
    return "paid";
  }

  throw new Error(`Unknown payment status: ${theStatus}`);
};

const getPurchasOrderStatusFromMercadoPago = (
  mercadoPagoStatus: PaymentResponse["status"],
): (typeof purchaseOrderStatusEnum)[number] => {
  const theStatus = mercadoPagoStatus?.toLowerCase();

  if (!theStatus) {
    return "open";
  } else if (theStatus === "pending") {
    return "open";
  } else if (theStatus === "inprocess") {
    return "open";
  } else if (theStatus === "inmediation") {
    return "open";
  } else if (theStatus === "cancelled") {
    return "open";
  } else if (theStatus === "rejected") {
    return "open";
  } else if (theStatus === "refunded") {
    return "open";
  } else if (theStatus === "chargeback") {
    return "open";
  } else if (theStatus === "approved") {
    return "complete";
  }

  throw new Error(`Unknown payment status: ${theStatus}`);
};

export const getMercadoPagoFetch =
  (token: string, logger: Logger) =>
  async <T>({
    url,
    method = "GET",
    body,
  }: {
    url: string;
    method?: RequestInit<RequestInitCfProperties>["method"];
    body?: Record<string, unknown>;
  }) => {
    let parsedUrl = url;

    if (!url.startsWith("/")) {
      parsedUrl = `/${url}`;
    }

    logger.info("Attempting to fetch URL:", parsedUrl);
    const headers = new Headers();

    headers.set("Authorization", `Bearer ${token}`);

    headers.set("Content-Type", "application/json");
    const response = await fetch(`https://api.mercadopago.com${parsedUrl}`, {
      method,
      headers,
      body: JSON.stringify(body),
    });
    const json = await response.json<T>();

    return json;
  };

export type MercadoPagoFetch = ReturnType<typeof getMercadoPagoFetch>;

export const createMercadoPagoPayment = async ({
  items,
  user,
  purchaseOrderId,
  getMercadoPagoClient,
  paymentSuccessRedirectURL,
  paymentCancelRedirectURL,
  eventId,
}: {
  items: Array<Items>;
  user: {
    email: string;
    id: string;
  };
  purchaseOrderId: string;
  getMercadoPagoClient: MercadoPagoFetch;
  paymentSuccessRedirectURL: string;
  paymentCancelRedirectURL: string;
  eventId: string;
}) => {
  const expirationDate = someMinutesIntoTheFuture(31);
  const expirationDateWithTimeZone = toISOStringWithTimezone(expirationDate);

  const body: PreferenceCreateData["body"] = {
    payer: {
      email: user.email,
    },
    items: items,
    back_urls: {
      success: `${paymentSuccessRedirectURL}?purchaseOrderId=${purchaseOrderId}&status=approved`,
      failure: `${paymentCancelRedirectURL}?purchaseOrderId=${purchaseOrderId}&status=rejected`,
      pending: `${paymentCancelRedirectURL}?purchaseOrderId=${purchaseOrderId}&status=pending`,
    },
    binary_mode: true,
    auto_return: "all",
    external_reference: purchaseOrderId,
    date_of_expiration: expirationDateWithTimeZone,
    metadata: {
      eventId,
    },
  };
  const mercadoPagoResponse = await getMercadoPagoClient<PreferenceResponse>({
    url: "/checkout/preferences/",
    method: "POST",
    body,
  });

  return {
    preference: mercadoPagoResponse,
    expirationDate: new Date(expirationDate).toISOString(),
  };
};

export const getMercadoPagoPreference = async ({
  preferenceId,
  getMercadoPagoClient,
  logger,
}: {
  preferenceId: string;
  getMercadoPagoClient: MercadoPagoFetch;
  logger: Logger;
}) => {
  const preference = await getMercadoPagoClient<PreferenceResponse>({
    url: `/checkout/preferences/${preferenceId}`,
  });

  logger.info("preference", preference);

  return preference;
};

export const getMercadoPagoPayment = async ({
  paymentId,
  getMercadoPagoClient,
}: {
  paymentId: string;
  getMercadoPagoClient: MercadoPagoFetch;
}) => {
  const payment = await getMercadoPagoClient<PaymentResponse>({
    url: `/v1/payments/${paymentId}`,
  });

  return {
    paymentStatus: getPaymentStatusFromMercadoPago(payment.status),
    status: getPurchasOrderStatusFromMercadoPago(payment.status),
  };
};
