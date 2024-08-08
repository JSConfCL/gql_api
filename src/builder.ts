import { AttributeValue } from "@opentelemetry/api";
import SchemaBuilder from "@pothos/core";
import AuthzPlugin from "@pothos/plugin-authz";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import TracingPlugin, {
  isRootField,
  wrapResolver,
} from "@pothos/plugin-tracing";
import { createOpenTelemetryWrapper } from "@pothos/tracing-opentelemetry";
import { DateResolver, DateTimeResolver } from "graphql-scalars";

import * as rules from "~/authz";
import { defaultLogger } from "~/logging";
import { tracer } from "~/tracing";
import { Context } from "~/types";

type TracingOptions = boolean | { attributes?: Record<string, AttributeValue> };

const createSpan = createOpenTelemetryWrapper<TracingOptions>(tracer, {
  includeSource: true,
  includeArgs: true,
});

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
    default: (config) => isRootField(config),
    wrap: (resolver, options, config) =>
      wrapResolver(resolver, (error, duration) => {
        defaultLogger.info(
          `[TRACING] ${config.parentType}.${config.name} in ${duration}ms`,
        );

        return createSpan(resolver, options);
      }),
  },
});

builder.queryType({});
builder.mutationType({});
builder.addScalarType("Date", DateResolver, {});
builder.addScalarType("DateTime", DateTimeResolver, {});
