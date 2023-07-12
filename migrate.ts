import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";

// const client = createClient({
//   url: "DATABASE_URL",
//   authToken: "DATABASE_AUTH_TOKEN",
// });

config({ path: process.cwd() + "/.dev.vars", override: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

if (!process.env.DATABASE_TOKEN) {
  throw new Error("DATABASE_URL is not defined");
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const sql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_TOKEN,
});
const db = drizzle(sql);
const main = async () => {
  await migrate(db, {
    migrationsFolder: process.cwd() + "/drizzle/migrations",
  });
  process.exit(0);
};
main()
  .then(() => console.log("Done!"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
