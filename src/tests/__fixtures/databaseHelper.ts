/* eslint-disable no-console */
import { neon } from "@neondatabase/serverless";
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import { faker } from "@faker-js/faker";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "~/datasources/db/schema";
import { ORM_TYPE } from "~/datasources/db";
import postgres from "postgres";

export const testDatabasesFolder = `.test_dbs`;
export const migrationsFolder = `${process.cwd()}/drizzle/migrations`;

const pgClient = postgres(process.env.POSTGRES_URL!);

const createDatabase = async () => {
  const databaseName = `${faker.string.uuid().replaceAll("-", "_")}`;
  await pgClient.unsafe(`DROP DATABASE IF EXISTS ${databaseName};`);
  await pgClient.unsafe(`CREATE DATABASE ${databaseName}`);
  return databaseName;

  // const databasePath = `${process.cwd()}/${testDatabasesFolder}/${databaseName}`;
  // const command = `echo "CREATE TABLE IF NOT EXISTS SOME_TABLE (id INTEGER PRIMARY KEY);" | sqlite3 ${databasePath}`;
  // return new Promise<string>((resolve, reject) => {
  //   exec(command, (err, stdout, stderr) => {
  //     /* c8 ignore next 4 */
  //     if (err) {
  //       console.error("ERROR CREATING DB", err);
  //       return reject(err);
  //     }
  //     /* c8 ignore next 4 */
  //     if (stderr) {
  //       console.error("STDERR", stderr);
  //       return reject(stderr);
  //     }
  //     return resolve(`${databasePath}`);
  //   });
  // });
};

let db: PostgresJsDatabase<typeof schema> | null = null;
export const getTestDB = async () => {
  if (db) {
    console.log("Retornando BDD previa");
    console.log("( Si quieres una nueva BDD, llama a clearDatabase() )");
    return db;
  } else {
    console.log("🆕 Creando una nueva BDD");
  }
  const databaseName = await createDatabase();
  const migrationClient = postgres(
    `postgres://postgres:postgres@0.0.0.0:5432/${databaseName}`,
    { max: 1 },
  );
  db = drizzle(migrationClient, { schema: { ...schema } });
  await migrate(db, {
    migrationsFolder,
    migrationsTable: "migrations",
  });
  return db as unknown as ORM_TYPE;
};

export const clearDatabase = () => {
  db = null;
};
