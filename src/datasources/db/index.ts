import { neon, neonConfig } from "@neondatabase/serverless";
import { NeonHttpDatabase, drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

neonConfig.fetchConnectionCache = true;

export type ORM_TYPE = NeonHttpDatabase<typeof schema>;
let db: ORM_TYPE | null = null;
export const getDb = ({
  neonUrl,
}: {
  url: string;
  authToken: string;
  neonUrl: string;
}) => {
  if (!db) {
    const client = neon(neonUrl);
    db = drizzle(client, {
      schema: { ...schema },
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
