import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: process.cwd() + "/.dev.vars",
  override: true,
});

if (!process.env.NEON_URL) {
  throw new Error("NEON_URL is not defined");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/workers/db_service/schema.ts",
  out: "./drizzle/migrations",
  breakpoints: true,
  strict: true,
  introspect: {
    casing: "preserve",
  },
  verbose: true,
  dbCredentials: {
    url: process.env.NEON_URL,
  },
});
