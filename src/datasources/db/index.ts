import { createClient } from "@libsql/client/web";
import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

let db: LibSQLDatabase<
  typeof import("/Users/ftorres/Github/jsconf/gql_api/src/datasources/db/schema")
> | null = null;
export const getDb = ({
  url,
  authToken,
}: {
  url: string;
  authToken: string;
}) => {
  if (!db) {
    const pool = createClient({ url, authToken });
    db = drizzle(pool, { schema });
  }
  return db;
};
