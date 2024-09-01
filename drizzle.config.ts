import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: process.cwd() + "/.dev.vars",
  override: true,
});

if (!process.env.NEON_URL) {
  throw new Error("NEON_URL is not defined");
}

if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID is not defined");
}

if (!process.env.CLOUDFLARE_DATABASE_ID) {
  throw new Error("CLOUDFLARE_DATABASE_ID is not defined");
}

if (!process.env.CLOUDFLARE_D1_TOKEN) {
  throw new Error("CLOUDFLARE_D1_TOKEN is not defined");
}

export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: "./src/datasources/db/schema.ts",
  out: "./drizzle/migrations",
  breakpoints: true,
  strict: true,
  introspect: {
    casing: "preserve",
  },
  verbose: true,
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID,
    token: process.env.CLOUDFLARE_D1_TOKEN,
  },
});
