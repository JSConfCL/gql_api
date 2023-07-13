import { faker } from "@faker-js/faker";
import { createClient } from "@libsql/client";
import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import sqlite3 from "sqlite3";
import { mkdir } from "fs/promises";
import { runMigration } from "~/tests/seeds/runMigrations";

const createSQLiteFile = (DB_URL: string) =>
  new Promise<string>((resolve, reject) => {
    console.info("Creating SQLite file", DB_URL);
    return new sqlite3.Database("", (err) => {
      if (err) {
        console.info("ERROR Creating SQLite ", DB_URL, err);
        return reject(err);
      }
      return resolve(DB_URL);
    });
  });

const createDatabase = async (): Promise<string> => {
  const new_database = `${faker.string.uuid().replaceAll("-", "_")}`;
  const folder = process.cwd() + "/.test_dbs";
  const file = `${folder}/${new_database}`;
  await mkdir(folder, { recursive: true });
  console.info("folder created", folder);
  await createSQLiteFile(file);
  console.info("DB created", file);
  return `file:///${file}`;
};

let drizzleCache: LibSQLDatabase<Record<string, never>> | null = null;
export const getTestDB = async () => {
  if (drizzleCache) {
    console.info(
      "Retornando instancia de Drizzle ya creada. Si quieres crear una nueva instancia, llama a clearDatabase()",
    );
    return drizzleCache;
  }
  const database = await createDatabase();
  console.info("DATABASE_URL", database);
  console.info("Creating Client");
  const sql = createClient({
    url: database,
  });
  console.info("Client created", sql);
  await runMigration(sql);
  // console.info("Query de prueba corrida", result);
  console.info("Creando cliente");
  drizzleCache = drizzle(sql);
  console.info("Retotnando Cliente: ", drizzleCache);
  return drizzleCache;
};

export const clearDatabase = () => {
  drizzleCache = null;
};
