import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { runMigration } from "~/datasources/db/runMigrations";

config({ path: process.cwd() + "/.dev.vars", override: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

if (!process.env.DATABASE_TOKEN) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_TOKEN,
});
runMigration(sql).catch((e) => {
  console.error(e);
  process.exit(1);
});
