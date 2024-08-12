import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import {
  PostgresJsDatabase,
  PostgresJsQueryResultHKT,
  drizzle,
} from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { Logger } from "~/logging";

import * as schema from "./schema";

export type ORM_TYPE = PostgresJsDatabase<typeof schema>;

export type TRANSACTION_HANDLER = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export const getDb = ({
  neonUrl,
  logger,
}: {
  neonUrl: string;
  logger: Logger;
}) => {
  const client = postgres(neonUrl);

  try {
    const db = drizzle(client, {
      schema,
    });

    return db;
  } catch (error) {
    logger.error("Error connecting to database", error);
    throw error;
  }
};
