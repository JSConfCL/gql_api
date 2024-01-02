/* eslint-disable no-console */
import { config } from "dotenv";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";

config({ path: process.cwd() + "/.dev.vars", override: true });

if (!process.env.NEON_URL) {
  throw new Error("NEON_URL is not defined");
}

const client = drizzle(neon(process.env.NEON_URL));

const sqlFilesPath = resolve(__dirname, "./drizzle/seeds");

const start = async () => {
  const data = readdirSync(sqlFilesPath);
  const sqlFiles = data.filter((file) => file.endsWith(".sql"));
  for (const file of sqlFiles) {
    const filePath = resolve(sqlFilesPath, file);
    console.log(`Running seed for: ${filePath}`);
    const contentStrings = readFileSync(filePath, "utf-8")
      .split("--> statement-breakpoint")
      .map((s) => s.trim());
    for (const contentString of contentStrings) {
      await client.execute(sql.raw(contentString));
    }
  }
  console.log(`Finished seeding of ${sqlFiles.length} files`);
};
start().catch(console.error);
