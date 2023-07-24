import SchemaBuilder from "@pothos/core";
import { DateResolver, DateTimeResolver } from "graphql-scalars";
import { ORM_TYPE } from "~/datasources/db";
import AuthzPlugin from "@pothos/plugin-authz";
import { rules } from "./authz";

export const builder = new SchemaBuilder<{
  Context: {
    DB: ORM_TYPE;
  };
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
  AuthZRule: keyof typeof rules;
}>({
  plugins: [AuthzPlugin],
});

builder.queryType({});
builder.mutationType({});
builder.addScalarType("Date", DateResolver, {});
builder.addScalarType("DateTime", DateTimeResolver, {});
