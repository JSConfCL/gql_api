import { createClient } from "@libsql/client/web";
import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// export const usersSchema =
// export const communitySchema =
// export const usersToCommunitiesSchema =

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
    const pool = createClient({ url, authToken });
    db = drizzle(pool, { schema: { ...schema } });
  }
  return db;
};
