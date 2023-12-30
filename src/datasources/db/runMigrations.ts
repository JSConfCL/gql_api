import { NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

export const runMigration = async (sql: NeonQueryFunction<false, false>) => {
  const db = drizzle(sql);
  const migrationsFolder = "./drizzle/migrations";
  await migrate(db, {
    migrationsFolder,
    migrationsTable: "migrations",
  });
};
