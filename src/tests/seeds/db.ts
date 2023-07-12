import { faker } from "@faker-js/faker";
import { createClient } from "@libsql/client";
import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import sqlite3 from "sqlite3";
import { runMigration } from "~/tests/seeds/runMigrations";

const {
  DATABASE_PORT,
  DATABASE_HOST,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_NAME,
} = process.env;
if (DATABASE_PORT === undefined || !Number(DATABASE_PORT)) {
  throw new Error("Missing process.env.DATABASE_PORT");
}
if (!DATABASE_HOST) {
  throw new Error("Missing process.env.DATABASE_HOST");
}
if (!DATABASE_USER) {
  throw new Error("Missing process.env.DATABASE_USER");
}
if (DATABASE_PASSWORD === undefined) {
  throw new Error("Missing process.env.DATABASE_PASSWORD");
}
if (DATABASE_NAME === undefined) {
  throw new Error("Missing process.env.DATABASE_NAME");
}

const createSQLiteFile = (NEW_DATABASE_NAME: string) => {
  const DB_URL = process.cwd() + ".test_dbs/" + NEW_DATABASE_NAME + ".db";
  return new Promise<string>((resolve, reject) => {
    return new sqlite3.Database(DB_URL, sqlite3.OPEN_READWRITE, (err) =>
      err ? reject(err) : resolve(DB_URL),
    );
  });
};

const createDatabase = async (): Promise<string> => {
  const new_database = `__JSCHILE_TEST__${faker.string
    .uuid()
    .replaceAll("-", "_")}`;
  const databasePath = await createSQLiteFile(new_database);
  return databasePath;
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
  const sql = createClient({
    url: database,
  });
  await runMigration(sql);
  // await client.connect();
  // Running a dummy query to ensure the connection is established
  console.log("Corriendo query de prueba");
  const result = await sql.execute("SELECT NOW()");
  console.log("Query de prueba corrida", result);
  console.log("Conectado a la BDD: ", database);
  drizzleCache = drizzle(sql);
  return drizzleCache;
};

export const clearDatabase = () => {
  drizzleCache = null;
};
