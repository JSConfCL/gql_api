import { Pool } from "@neondatabase/serverless";
import { ExtractTablesWithRelations } from "drizzle-orm";
import {
  NeonDatabase,
  NeonQueryResultHKT,
  drizzle,
} from "drizzle-orm/neon-serverless";
import { PgTransaction } from "drizzle-orm/pg-core";

import * as schema from "./schema";

export type ORM_TYPE = NeonDatabase<typeof schema>;
export type TRANSACTION_HANDLER = PgTransaction<
  NeonQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export const getDb = ({ neonUrl }: { neonUrl: string }) => {
  const client = new Pool({
    connectionString: neonUrl,
  });
  const db = drizzle(client, {
    schema,
    logger: {
      logQuery(query, params) {
        // eslint-disable-next-line no-console
        console.log(query, params);
      },
    },
  });
  return db;
};
