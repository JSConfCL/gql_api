import SchemaBuilder from "@pothos/core";
import AuthzPlugin from "@pothos/plugin-authz";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import TracingPlugin, { isRootField } from "@pothos/plugin-tracing";
import { DateResolver, DateTimeResolver } from "graphql-scalars";

import * as rules from "~/authz";
import { Context } from "~/types";

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
    wrap: (resolver) => {
      return async (parent, args, context, info) => {
        const start = Date.now();
        const result = await resolver(parent, args, context, info);
        const duration = Date.now() - start;

        context.logger.debug("[TRACING]", {
          path: info.path,
          duration,
          operation: info.operation?.operation,
        });

        return result;
      };
    },
  },
});

builder.queryType({});

builder.mutationType({});

builder.addScalarType("Date", DateResolver, {});

builder.addScalarType("DateTime", DateTimeResolver, {});
