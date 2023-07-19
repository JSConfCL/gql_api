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

let db: ORM_TYPE | null = null;
export const getTestDB = async () => {
  if (db) {
    console.info("👌 Retornando BDD previa");
    console.info("Si quieres una nueva BDD, llama a clearDatabase()");
    return db;
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
  db = drizzle(client, { schema: { ...schema } });
  console.info("MIGRATING");
  await migrate(db, {
    migrationsFolder,
    migrationsTable: "migrations",
  });
  return db;
};

export const clearDatabase = () => {
  db = null;
};
