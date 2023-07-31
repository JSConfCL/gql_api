/* eslint-disable no-console */
import { faker } from "@faker-js/faker";
import { createClient } from "@libsql/client";
import { exec } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "~/datasources/db/schema";
import { ORM_TYPE } from "~/datasources/db";

const testDabasesFolder = `.test_dbs`;
const migrationsFolder = `${process.cwd()}/drizzle/migrations`;
/* c8 ignore next 3 */
if (!existsSync(`./${testDabasesFolder}`)) {
  mkdirSync(`./${testDabasesFolder}`);
}
const createDatabase = () => {
  const databaseName = `${faker.string.uuid().replaceAll("-", "_")}`;
  const databasePath = `${process.cwd()}/${testDabasesFolder}/${databaseName}`;
  const command = `echo "CREATE TABLE IF NOT EXISTS SOME_TABLE (id INTEGER PRIMARY KEY);" | sqlite3 ${databasePath}`;
  return new Promise<string>((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      /* c8 ignore next 4 */
      if (err) {
        console.error("ERROR CREATING DB", err);
        return reject(err);
      }
      /* c8 ignore next 4 */
      if (stderr) {
        console.error("STDERR", stderr);
        return reject(stderr);
      }
      return resolve(`${databasePath}`);
    });
  });
};

let db: ORM_TYPE | null = null;
export const getTestDB = async () => {
  if (db) {
    console.info("Retornando BDD previa");
    console.info("( Si quieres una nueva BDD, llama a clearDatabase() )");
    return db;
  } else {
    console.info("🆕 Creando una nueva BDD");
  }
  const databaseName = await createDatabase();
  const url = `file:///${databaseName}`;
  const client = createClient({
    url,
  });
  db = drizzle(client, { schema: { ...schema } });
  await migrate(db, {
    migrationsFolder,
    migrationsTable: "migrations",
  });
  return db;
};

export const clearDatabase = () => {
  db = null;
};
