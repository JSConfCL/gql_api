// import { DateTimeResolver } from "graphql-scalars";
import SchemaBuilder from "@pothos/core";
import { LibSQLDatabase } from "drizzle-orm/libsql";

export const builder = new SchemaBuilder<{
  Context: {
    DB: LibSQLDatabase<Record<string, never>>;
  };
}>({});

builder.queryType({});

// builder.mutationType();
