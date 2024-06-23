import { writeFile } from "node:fs/promises";

import {
  // printIntrospectionSchema,
  printSchema,
} from "graphql/utilities";

import { logger } from "~/logging";
import { schema } from "~/schema";

const start = async () => {
  const schemaString = printSchema(schema);
  await writeFile("./src/generated/schema.gql", schemaString, "utf-8");
};

start().catch(logger.error);
