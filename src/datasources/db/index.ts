import { createClient } from "@libsql/client/web";
import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type ORM_TYPE = LibSQLDatabase<typeof schema>;
let db: ORM_TYPE | null = null;
export const getDb = ({
  url,
  authToken,
}: {
  url: string;
  authToken: string;
}) => {
  if (!db) {
    const client = createClient({ url, authToken });
    db = drizzle(client, { schema: { ...schema }, logger: true });
  }
  return db;
};
