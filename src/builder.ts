import SchemaBuilder from "@pothos/core";
import AuthzPlugin from "@pothos/plugin-authz";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import TracingPlugin, { wrapResolver } from "@pothos/plugin-tracing";
import { DateResolver, DateTimeResolver } from "graphql-scalars";

import * as rules from "~/authz";
import { createLogger } from "~/logging";
import { Context } from "~/types";

const tracingLogger = createLogger("tracing");

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
  plugins: [TracingPlugin, AuthzPlugin, DataloaderPlugin],
  tracing: {
    default: () => true,
    wrap: (resolver, options, config) =>
      wrapResolver(resolver, (error, duration) => {
        tracingLogger.debug(
          `[TRACING] ${config.parentType}.${config.name} in ${duration}ms`,
        );
      }),
  },
});

builder.queryType({});

builder.mutationType({});

builder.addScalarType("Date", DateResolver, {});

builder.addScalarType("DateTime", DateTimeResolver, {});
