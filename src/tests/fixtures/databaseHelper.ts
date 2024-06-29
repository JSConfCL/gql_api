/* eslint-disable no-console */
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { v4 } from "uuid";

import { ORM_TYPE } from "~/datasources/db";
import * as schema from "~/datasources/db/schema";

export const testDatabasesFolder = `.test_dbs`;
export const migrationsFolder = `${process.cwd()}/drizzle/migrations`;

const dbUrl = `postgres://postgres:postgres@${
  process.env.POSTGRES_HOST || "localhost"
}:${process.env.POSTGRES_PORT || 5432}`;

const ensureDBIsClean = async (databaseName: string) => {
  const pgClient = postgres(dbUrl);

  await pgClient.unsafe(`DROP DATABASE IF EXISTS "${databaseName}";`);
  await pgClient.unsafe(`CREATE DATABASE "${databaseName}"`);
  await pgClient.end();

  return databaseName;
};

let db: PostgresJsDatabase<typeof schema> | null = null;
let client: postgres.Sql<Record<string, unknown>> | null = null;
export const getTestDB = async (maybeDatabaseName?: string) => {
  const databaseName = maybeDatabaseName || `test_${v4()}`;

  if (db) {
    console.log("Retornando BDD previa");
    return db as unknown as ORM_TYPE;
  }

  console.log("🆕 Creando una nueva BDD");
  await ensureDBIsClean(databaseName);
  const migrationClient = postgres(`${dbUrl}/${databaseName}`, { max: 1 });

  client = migrationClient;
  db = drizzle(migrationClient, { schema: { ...schema } });
  await migrate(db, {
    migrationsFolder,
    migrationsTable: "migrations",
  });

  return db as unknown as ORM_TYPE;
};

export const closeConnection = async () => {
  await client?.end();
  db = null;
  client = null;
};
