import pino from "pino";
import { Resend } from "resend";

import { Env } from "worker-configuration";
import { ORM_TYPE } from "~/datasources/db";
import { USER } from "~/datasources/db/schema";
import { MercadoPagoFetch } from "~/datasources/mercadopago";
import { getSanityClient } from "~/datasources/sanity/client";
import { getStripeClient } from "~/datasources/stripe/client";

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
};

export type GraphqlContext = Context &
  Env & {
    request: Request;
  };
