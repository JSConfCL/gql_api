import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

export const getDb = ({
  url,
  authToken,
}: {
  url: string;
  authToken: string;
}) => {
  const pool = createClient({ url, authToken });
  const db = drizzle(pool);
  return db;
};
