import {
  InputShapeFromTypeParam,
  InputTypeParam,
  SchemaTypes,
  ShapeFromTypeParam,
  TypeParam,
} from "@pothos/core";
import { Resend } from "resend";

import { Env } from "worker-configuration";
import { ORM_TYPE } from "~/datasources/db";
import { USER } from "~/datasources/db/schema";
import { MercadoPagoFetch } from "~/datasources/mercadopago";
import { getSanityClient } from "~/datasources/sanity/client";
import { getStripeClient } from "~/datasources/stripe/client";
import { Logger } from "~/logging";

export type Context = {
  DB: ORM_TYPE;
  logger: Logger;
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
};

export type GraphqlContext = Context &
  Env & {
    request: Request;
  };

export type InferPothosInputType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Builder extends PothosSchemaTypes.SchemaBuilder<any>,
  T extends InputTypeParam<Types>,
  Types extends SchemaTypes = Builder extends PothosSchemaTypes.SchemaBuilder<
    infer S
  >
    ? S
    : never,
> = InputShapeFromTypeParam<Types, T, true>;

export type InferPothosOutputType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Builder extends PothosSchemaTypes.SchemaBuilder<any>,
  T extends TypeParam<Types>,
  Types extends SchemaTypes = Builder extends PothosSchemaTypes.SchemaBuilder<
    infer S
  >
    ? S
    : never,
> = ShapeFromTypeParam<Types, T, false>;
