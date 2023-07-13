import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({
  path: process.cwd() + "/.dev.vars",
  override: true,
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}
if (!process.env.DATABASE_TOKEN) {
  throw new Error("DATABASE_TOKEN is not defined");
}

console.log({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_TOKEN: process.env.DATABASE_TOKEN,
});
export default {
  schema: "./src/datasources/db/schema.ts",
  driver: "turso",
  out: "./drizzle/migrations",
  breakpoints: true,
  strict: true,
  introspect: {
    casing: "preserve",
  },
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_TOKEN,
  },
} satisfies Config;
