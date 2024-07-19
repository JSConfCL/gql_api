import { ExtractTablesWithRelations } from "drizzle-orm";
import {
  NodePgDatabase,
  NodePgQueryResultHKT,
  drizzle,
} from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import { Client } from "pg";
import { Logger } from "pino";

import * as schema from "./schema";

export type ORM_TYPE = NodePgDatabase<typeof schema>;
export type TRANSACTION_HANDLER = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export const getDb = async ({
  neonUrl,
  logger,
}: {
  neonUrl: string;
  logger: Logger<never>;
}) => {
  const client = new Client({
    connectionString: neonUrl,
  });

  try {
    await client.connect();
    const db = drizzle(client, {
      schema,
      // logger: {
      //   logQuery(query, params) {
      //     logger.info(query, params);
      //   },
      // },
    });

    return db;
  } catch (error) {
    logger.error("Error connecting to database", error);
    throw error;
  }
};
