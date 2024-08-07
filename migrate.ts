/* eslint-disable no-console */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

import { runMigration } from "~workers/db_service/runMigrations";
import { defaultLogger } from "~/logging";

config({ path: process.cwd() + "/.dev.vars", override: true });

if (!process.env.NEON_URL) {
  throw new Error("NEON_URL is not defined");
}

const client = neon(process.env.NEON_URL);

runMigration(client).catch((e) => {
  defaultLogger.error(e);
  process.exit(1);
});
