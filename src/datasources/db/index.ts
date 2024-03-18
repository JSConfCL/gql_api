import { Pool } from "@neondatabase/serverless";
import { NeonDatabase, drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

export type ORM_TYPE = NeonDatabase<typeof schema>;
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
