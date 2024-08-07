import pino from "pino";
import { Resend } from "resend";

import { Env } from "worker-configuration";
import { MercadoPagoFetch } from "~/datasources/mercadopago";
import { getSanityClient } from "~/datasources/sanity/client";
import { getStripeClient } from "~/datasources/stripe/client";
import { ORM_TYPE } from "~workers/db_service/db";
import { USER } from "~workers/db_service/db/schema";

export type Context = {
  DB: ORM_TYPE;
  logger: pino.Logger<never>;
  GET_SANITY_CLIENT: () => ReturnType<typeof getSanityClient>;
  GET_STRIPE_CLIENT: () => ReturnType<typeof getStripeClient>;
  GET_MERCADOPAGO_CLIENT: MercadoPagoFetch;
  RESEND: Resend;
  USER: USER | null;
  ORIGINAL_USER: USER | null;
  MAIL_QUEUE: Queue;
  GOOGLE_PHOTOS_IMPORT_QUEUE: Queue;
  PURCHASE_CALLBACK_URL: string;
  RPC_SERVICE_EMAIL: Env["RPC_SERVICE_EMAIL"];
  RPC_SERVICE_DB: Env["RPC_SERVICE_DB"];
};

export type GraphqlContext = Context &
  Env & {
    request: Request;
  };
