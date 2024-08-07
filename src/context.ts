import { initContextCache } from "@pothos/core";
import { YogaInitialContext } from "graphql-yoga";
import pino from "pino";
import { Resend } from "resend";

import { Env } from "worker-configuration";
import { getUserFromRequest, upsertUserFromRequest } from "~/authn";
import { getDb } from "~/datasources/db";
import { getMercadoPagoFetch } from "~/datasources/mercadopago";
import { getSanityClient } from "~/datasources/sanity/client";
import { getStripeClient } from "~/datasources/stripe/client";
import { APP_ENV } from "~/env";
import { Context } from "~/types";

//
export const createGraphqlContext = async ({
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
  RPC_SERVICE_EMAIL,
  logger,
}: YogaInitialContext &
  Env & {
    logger: pino.Logger<never>;
  }): Promise<Context> => {
  if (!MAIL_QUEUE) {
    throw new Error("Missing MAIL_QUEUE");
  }

  if (!RPC_SERVICE_EMAIL) {
    throw new Error("RPC_SERVICE_EMAIL is not defined");
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
  const GET_MERCADOPAGO_CLIENT = getMercadoPagoFetch(MERCADOPAGO_KEY, logger);
  const DB = await getDb({
    neonUrl: DB_URL,
    logger,
  });
  const RESEND = new Resend(RESEND_API_KEY);
  const ORIGINAL_USER = await upsertUserFromRequest({
    request,
    SUPABASE_JWT_DECODER,
    DB,
    logger,
  });

  // This is the user that will be used for mostly all queries across the
  // application. However, in some cases, we might want to use the original
  // user. (Like on the "me" query)
  // Function does a passthrough to the ORIGINAL_USER if the user does not have
  // impersonation capabilities.
  const USER = await getUserFromRequest({
    ORIGINAL_USER,
    request,
    DB,
    logger,
  });

  return {
    ...initContextCache(),
    DB,
    USER,
    ORIGINAL_USER,
    RESEND,
    PURCHASE_CALLBACK_URL,
    GOOGLE_PHOTOS_IMPORT_QUEUE,
    MAIL_QUEUE,
    GET_SANITY_CLIENT,
    GET_STRIPE_CLIENT,
    GET_MERCADOPAGO_CLIENT,
    logger,
    RPC_SERVICE_EMAIL,
  } satisfies Context;
};
