import { MercadoPagoConfig, Preference } from "mercadopago";
import { Items } from "mercadopago/dist/clients/commonTypes";
import { PreferenceResponse } from "mercadopago/dist/clients/preference/commonTypes";
import { PreferenceCreateData } from "mercadopago/dist/clients/preference/create/types";

// import {
//   puchaseOrderPaymentStatusEnum,
//   purchaseOrderStatusEnum,
// } from "~/datasources/db/schema";
import {
  someMinutesIntoTheFuture,
  toISOStringWithTimezone,
} from "~/datasources/helpers";

export const getMercadoPagoFetch =
  (token: string) =>
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
  PURCHASE_CALLBACK_URL,
  eventId,
}: {
  items: Array<Items>;
  user: {
    email: string;
    id: string;
  };
  purchaseOrderId: string;
  getMercadoPagoClient: MercadoPagoFetch;
  PURCHASE_CALLBACK_URL: string;
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
