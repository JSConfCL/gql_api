import { config } from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

config({ path: process.cwd() + "/.dev.vars", override: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });
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
