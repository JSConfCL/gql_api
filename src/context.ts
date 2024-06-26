import { initContextCache } from "@pothos/core";
import { YogaInitialContext } from "graphql-yoga";
import { Resend } from "resend";

import { Env } from "worker-configuration";
import { getUser } from "~/authn";
import { getDb } from "~/datasources/db";
import { getMercadoPagoFetch } from "~/datasources/mercadopago";
import { getSanityClient } from "~/datasources/sanity/client";
import { getStripeClient } from "~/datasources/stripe/client";
import { APP_ENV } from "~/env";
import { Context } from "~/types";

export const creageGraphqlContext = async ({
  request,
  NEON_URL,
  PURCHASE_CALLBACK_URL,
  MAIL_QUEUE,
  GOOGLE_PHOTOS_IMPORT_QUEUE,
  SANITY_PROJECT_ID,
  SANITY_DATASET,
  RESEND_API_KEY,
  SANITY_API_VERSION,
  SANITY_SECRET_TOKEN,
  SUPABASE_JWT_DECODER,
  STRIPE_KEY,
  HYPERDRIVE,
  MERCADOPAGO_KEY,
}: YogaInitialContext & Env): Promise<Context> => {
  if (!MAIL_QUEUE) {
    throw new Error("Missing MAIL_QUEUE");
  }

  if (!GOOGLE_PHOTOS_IMPORT_QUEUE) {
    throw new Error("Missing GOOGLE_PHOTOS_IMPORT_QUEUE");
  }

  if (!NEON_URL) {
    throw new Error("Missing NEON_URL");
  }

  if (!SUPABASE_JWT_DECODER) {
    throw new Error("Missing SUPABASE_JWT_DECODER");
  }

  if (!STRIPE_KEY) {
    throw new Error("Missing STRIPE_KEY");
  }

  if (!MERCADOPAGO_KEY) {
    throw new Error("Missing MERCADOPAGO_KEY");
  }

  if (!PURCHASE_CALLBACK_URL) {
    throw new Error("Missing PURCHASE_CALLBACK_URL");
  }

  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (
    !SANITY_PROJECT_ID ||
    !SANITY_DATASET ||
    !SANITY_API_VERSION ||
    !SANITY_SECRET_TOKEN
  ) {
    throw new Error("Missing Sanity Configuration");
  }

  const DB_URL =
    HYPERDRIVE?.connectionString?.startsWith("postgresql://fake-user:fake") &&
    APP_ENV === "development"
      ? NEON_URL
      : HYPERDRIVE.connectionString;

  const GET_SANITY_CLIENT = () =>
    getSanityClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: SANITY_API_VERSION,
      token: SANITY_SECRET_TOKEN,
      useCdn: true,
    });

  const GET_STRIPE_CLIENT = () => getStripeClient(STRIPE_KEY);
  const GET_MERCADOPAGO_CLIENT = getMercadoPagoFetch(MERCADOPAGO_KEY);
  const DB = await getDb({
    neonUrl: DB_URL,
  });
  const RESEND = new Resend(RESEND_API_KEY);
  const USER = await getUser({
    request,
    SUPABASE_JWT_DECODER,
    DB,
  });

  return {
    ...initContextCache(),
    DB,
    USER,
    RESEND,
    PURCHASE_CALLBACK_URL,
    GOOGLE_PHOTOS_IMPORT_QUEUE,
    MAIL_QUEUE,
    GET_SANITY_CLIENT,
    GET_STRIPE_CLIENT,
    GET_MERCADOPAGO_CLIENT,
  } satisfies Context;
};
