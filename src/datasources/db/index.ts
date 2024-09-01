import { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";

import { Logger } from "~/logging";

import * as schema from "./schema";

export type TRANSACTION_HANDLER = SQLiteTransaction<
  "async",
  D1Result<unknown>,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type ORM_TYPE = DrizzleD1Database<typeof schema> | TRANSACTION_HANDLER;

export const getDb = ({ D1, logger }: { D1: D1Database; logger: Logger }) => {
  try {
    const db = drizzle(D1, {
      schema,
    });

    return db;
  } catch (error) {
    logger.error("Error connecting to database", error);
    throw error;
  }
};
