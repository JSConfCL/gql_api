import { faker } from "@faker-js/faker";
import { createClient } from "@libsql/client";
import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import sqlite3 from "sqlite3";
import { mkdir } from "fs/promises";
import { runMigration } from "~/tests/seeds/runMigrations";

sqlite3.verbose();

const createSQLiteFile = (DB_URL: string) =>
  new Promise<string>((resolve, reject) => {
    console.log("Creating SQLite file", DB_URL);
    return new sqlite3.Database("", (err) => {
      if (err) {
        console.log("ERROR Creating SQLite ", DB_URL, err);
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
  console.log("folder created", folder);
  await createSQLiteFile(file);
  console.log("DB created", file);
  return `file:///${file}`;
};

let drizzleCache: LibSQLDatabase<Record<string, never>> | null = null;
// Nos aseguramos q los seeds no cambien entre ejecucio
export const getTestDB = async () => {
  if (drizzleCache) {
    console.log(
      "Retornando instancia de Drizzle ya creada. Si quieres crear una nueva instancia, llama a clearDatabase()",
    );
    return drizzleCache;
  }
  const database = await createDatabase();
  console.log("DATABASE_URL", database);
  console.log("Creating Client");
  const sql = createClient({
    url: database,
  });
  console.log("Client created", sql);
  await runMigration(sql);
  // await client.connect();
  // Running a dummy query to ensure the connection is established
  console.log("Corriendo query de prueba");
  const result = await sql.execute("SELECT sqlite_version();");
  console.log("Query de prueba corrida", result);
  console.log("Conectado a la BDD: ", database);
  drizzleCache = drizzle(sql);
  return drizzleCache;
};

export const clearDatabase = () => {
  drizzleCache = null;
};
