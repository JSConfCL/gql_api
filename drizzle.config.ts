import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({
  path: process.cwd() + "/.dev.vars",
  override: true,
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export default {
  schema: "./src/datasources/db/schema.ts",
  driver: "pg",
  out: "./drizzle/migrations",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
} satisfies Config;
