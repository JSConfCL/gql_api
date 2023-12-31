/* eslint-disable no-console */
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "~/datasources/db/schema";
import { ORM_TYPE } from "~/datasources/db";
import postgres from "postgres";
import { v4 } from "uuid";

export const testDatabasesFolder = `.test_dbs`;
export const migrationsFolder = `${process.cwd()}/drizzle/migrations`;

const dbUrl = "postgres://postgres:postgres@0.0.0.0:5432";

const ensureDBIsClean = async (databaseName: string) => {
  const pgClient = postgres(dbUrl);
  await pgClient.unsafe(`DROP DATABASE IF EXISTS "${databaseName}";`);
  await pgClient.unsafe(`CREATE DATABASE "${databaseName}"`);
  await pgClient.end();
  return databaseName;
};

let db: PostgresJsDatabase<typeof schema> | null = null;
export const getTestDB = async (maybeDatabaseName?: string) => {
  const databaseName = maybeDatabaseName || `test_${v4()}`;
  if (db) {
    console.log("Retornando BDD previa");
    return db;
  }
  console.log("🆕 Creando una nueva BDD");
  await ensureDBIsClean(databaseName);
  const migrationClient = postgres(
    `postgres://postgres:ftorres@0.0.0.0:5432/${databaseName}`,
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
