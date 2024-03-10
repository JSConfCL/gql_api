import { writeFile } from "node:fs/promises";

import {
  // printIntrospectionSchema,
  printSchema,
} from "graphql/utilities";

import { schema } from "~/schema";

const start = async () => {
  const schemaString = printSchema(schema);
  await writeFile("./src/generated/schema.gql", schemaString, "utf-8");
};

// eslint-disable-next-line no-console
start().catch(console.error);
