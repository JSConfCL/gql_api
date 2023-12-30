/* eslint-disable no-console */
import { config } from "dotenv";
import { runMigration } from "~/datasources/db/runMigrations";
import { neon } from "@neondatabase/serverless";

config({ path: process.cwd() + "/.dev.vars", override: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

if (!process.env.DATABASE_TOKEN) {
  throw new Error("DATABASE_URL is not defined");
}

if (!process.env.NEON_URL) {
  throw new Error("NEON_URL is not defined");
}

const client = neon(process.env.NEON_URL);

runMigration(client).catch((e) => {
  console.error(e);
  process.exit(1);
});
