import { Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

export const runMigration = async (sql: Client) => {
  const db = drizzle(sql);
  await migrate(db, {
    migrationsFolder: process.cwd() + "/drizzle/migrations",
  });
};
