import SchemaBuilder from "@pothos/core";
import AuthzPlugin from "@pothos/plugin-authz";
import TracingPlugin, { wrapResolver } from "@pothos/plugin-tracing";
import { DateResolver, DateTimeResolver } from "graphql-scalars";
import { Resend } from "resend";

import { Env } from "worker-configuration";
import * as rules from "~/authz";
import { ORM_TYPE } from "~/datasources/db";
import { USER } from "~/datasources/db/schema";
import { logger } from "~/logging";

import { MercadoPagoFetch } from "./datasources/mercadopago";
import { getSanityClient } from "./datasources/sanity/client";
import { getStripeClient } from "./datasources/stripe/client";

export type Context = {
  DB: ORM_TYPE;
  GET_SANITY_CLIENT: () => ReturnType<typeof getSanityClient>;
  GET_STRIPE_CLIENT: () => ReturnType<typeof getStripeClient>;
  GET_MERCADOPAGO_CLIENT: MercadoPagoFetch;
  RESEND: Resend;
  USER: USER | null;
  MAIL_QUEUE: Queue;
  GOOGLE_PHOTOS_IMPORT_QUEUE: Queue;
  PURCHASE_CALLBACK_URL: string;
};

export type GraphqlContext = Context &
  Env & {
    request: Request;
  };

export const builder = new SchemaBuilder<{
  Context: Context;
  AuthZRule: keyof typeof rules;
  Scalars: {
    Date: {
      Input: Date;
      Output: Date;
    };
    DateTime: {
      Input: Date;
      Output: Date;
    };
  };
}>({
  plugins: [TracingPlugin, AuthzPlugin],
  tracing: {
    default: () => true,
    wrap: (resolver, options, config) =>
      wrapResolver(resolver, (error, duration) => {
        logger.debug(
          `[TRACING] ${config.parentType}.${config.name} in ${duration}ms`,
        );
      }),
  },
});

builder.queryType({});
builder.mutationType({});
builder.addScalarType("Date", DateResolver, {});
builder.addScalarType("DateTime", DateTimeResolver, {});
