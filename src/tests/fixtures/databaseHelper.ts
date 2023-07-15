import { faker } from "@faker-js/faker";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { exec } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const testDabasesFolder = `.test_dbs`;
const migrationsFolder = "./drizzle/migrations";

const createDatabase = () => {
  const databaseName = `${faker.string.uuid().replaceAll("-", "_")}`;
  const databasePath = `${process.cwd()}/${testDabasesFolder}/${databaseName}`;
  const command = `echo "CREATE TABLE IF NOT EXISTS SOME_TABLE (id INTEGER PRIMARY KEY);" | sqlite3 ${databasePath}`;
  if (!existsSync(`./${testDabasesFolder}`)) {
    mkdirSync(`./${testDabasesFolder}`);
  }
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
  drizzleCache = drizzle(client);
  console.info("MIGRATING");
  await migrate(drizzleCache, {
    migrationsFolder,
  });
  return drizzleCache;
};

export const clearDatabase = () => {
  drizzleCache = null;
};
