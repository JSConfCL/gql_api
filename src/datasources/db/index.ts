import { Pool } from "@neondatabase/serverless";
import { NeonDatabase, drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

export type ORM_TYPE = NeonDatabase<typeof schema>;
let db: ORM_TYPE | null = null;
export const getDb = ({ neonUrl }: { neonUrl: string }) => {
  if (!db) {
    const client = new Pool({
      connectionString: neonUrl,
    });
    db = drizzle(client, {
      schema,
      logger: {
        logQuery(query, params) {
          // eslint-disable-next-line no-console
          console.log(query, params);
        },
      },
    });
  }
  return db;
};
