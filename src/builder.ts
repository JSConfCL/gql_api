import SchemaBuilder from "@pothos/core";
import { ORM_TYPE } from "~/datasources/db";

export const builder = new SchemaBuilder<{
  Context: {
    DB: ORM_TYPE;
  };
}>({});

builder.queryType({});
