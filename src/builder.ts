import SchemaBuilder from "@pothos/core";
import { DateResolver, DateTimeResolver } from "graphql-scalars";
import { ORM_TYPE } from "~/datasources/db";
import * as rules from "~/authz";
import AuthzPlugin from "@pothos/plugin-authz";
import { selectUsersSchema } from "~/datasources/db/schema";
import { z } from "zod";
import { Env } from "worker-configuration";
import TracingPlugin, { wrapResolver } from "@pothos/plugin-tracing";
import { createOpenTelemetryWrapper } from "@pothos/tracing-opentelemetry";
import { APP_ENV } from "./env";
import { tracer } from "./tracer";

const createSpan = createOpenTelemetryWrapper(tracer, {
  includeSource: true,
});

type Context = {
  DB: ORM_TYPE;
  USER: z.infer<typeof selectUsersSchema> | null;
  MAIL_QUEUE: Queue;
  GOOGLE_PHOTOS_IMPORT_QUEUE: Queue;
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
    default: () => APP_ENV !== "production",
    wrap: (resolver, options, config) => createSpan(resolver, options),
    // wrapResolver(resolver, (_error, duration) => {
    //   // eslint-disable-next-line no-console
    //   console.log(
    //     `[tracing] ${config.parentType}.${config.name} took ${duration}ms`,
    //   );
    // }),
  },
});

builder.queryType({});
builder.mutationType({});
builder.addScalarType("Date", DateResolver, {});
builder.addScalarType("DateTime", DateTimeResolver, {});
