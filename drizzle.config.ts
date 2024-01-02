import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({
  path: process.cwd() + "/.dev.vars",
  override: true,
});

if (!process.env.NEON_URL) {
  throw new Error("NEON_URL is not defined");
}

export default {
  schema: "./src/datasources/db/schema.ts",
  driver: "pg",
  out: "./drizzle/migrations",
  breakpoints: true,
  strict: true,
  introspect: {
    casing: "preserve",
  },
  verbose: true,
  dbCredentials: {
    connectionString: process.env.NEON_URL,
  },
} satisfies Config;
