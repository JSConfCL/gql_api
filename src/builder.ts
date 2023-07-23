import SchemaBuilder from "@pothos/core";
import { DateResolver, DateTimeResolver } from "graphql-scalars";
import { ORM_TYPE } from "~/datasources/db";

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
}>({});

builder.queryType({});
builder.addScalarType("Date", DateResolver, {});
builder.addScalarType("DateTime", DateTimeResolver, {});
