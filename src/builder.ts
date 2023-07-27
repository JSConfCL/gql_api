import SchemaBuilder from "@pothos/core";
import { DateResolver, DateTimeResolver } from "graphql-scalars";
import { ORM_TYPE } from "~/datasources/db";
import * as rules from "~/authz";
import AuthzPlugin from "@pothos/plugin-authz";
import { selectUsersSchema } from "~/datasources/db/CRUD";
import { z } from "zod";
import { Env } from "worker-configuration";

type Context = {
  DB: ORM_TYPE;
  USER: z.infer<typeof selectUsersSchema> | null;
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
  plugins: [AuthzPlugin],
});

builder.queryType({});
builder.mutationType({});
builder.addScalarType("Date", DateResolver, {});
builder.addScalarType("DateTime", DateTimeResolver, {});
