import { createClient } from "@libsql/client/web";
import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";

let db: LibSQLDatabase<Record<string, never>> | null = null;
export const getDb = ({
  url,
  authToken,
}: {
  url: string;
  authToken: string;
}) => {
  if (!db) {
    const pool = createClient({ url, authToken });
    db = drizzle(pool);
  }
  return db;
};
