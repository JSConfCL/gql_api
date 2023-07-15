import { faker } from "@faker-js/faker";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { exec } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { Logger } from "drizzle-orm";

const testDabasesFolder = `.test_dbs`;
const migrationsFolder = `${process.cwd()}/drizzle/migrations`;
if (!existsSync(`./${testDabasesFolder}`)) {
  mkdirSync(`./${testDabasesFolder}`);
}
const createDatabase = () => {
  const databaseName = `${faker.string.uuid().replaceAll("-", "_")}`;
  const databasePath = `${process.cwd()}/${testDabasesFolder}/${databaseName}`;
  const command = `echo "CREATE TABLE IF NOT EXISTS SOME_TABLE (id INTEGER PRIMARY KEY);" | sqlite3 ${databasePath}`;
  // console.info("Creating Database", databaseName);
  return new Promise<string>((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("ERROR CREATING DB", err);
        return reject(err);
      }
      if (stderr) {
        console.error("STDERR", stderr);
        return reject(stderr);
      }
      console.info("Database created", databasePath);
      return resolve(`${databasePath}`);
    });
  });
};

class MyLogger implements Logger {
  logQuery(query: string, params: string[]): void {
    // console.log("".padEnd(80, "-"));
    // console.log(query);
    if (params.length > 0) params.map((p, i) => `$${i + 1}: ${p}`);
  }
}

let drizzleCache: LibSQLDatabase<Record<string, never>> | null = null;
export const getTestDB = async () => {
  if (drizzleCache) {
    console.info("👌 Retornando BDD previa");
    console.info("Si quieres una nueva BDD, llama a clearDatabase()");
    return drizzleCache;
  } else {
    console.info("🆕 Creando una nueva BDD");
  }
  const databaseName = await createDatabase();
  const url = `file:///${databaseName}`;
  console.info("CREATING CLIENT WITH FILE: ", url);
  const client = createClient({
    url,
  });
  console.info("CREATING CLIENT DRIZZLE");
  drizzleCache = drizzle(client, {
    logger: new MyLogger(),
  });
  console.info("MIGRATING");
  await migrate(drizzleCache, {
    migrationsFolder,
    migrationsTable: "migrations",
  });
  return drizzleCache;
};

export const clearDatabase = () => {
  drizzleCache = null;
};
