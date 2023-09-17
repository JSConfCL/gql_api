/* eslint-disable no-console */
import { faker } from "@faker-js/faker";
import { createClient } from "@libsql/client";
import { exec } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "~/datasources/db/schema";
import { ORM_TYPE } from "~/datasources/db";
import Sqlite3, { Database } from "better-sqlite3";

import os from "node:os";

const getSQLeanPackageToInstall = () => {
  const arch = os.arch();
  const platform = os.platform();
  // MAC
  if (platform === "darwin") {
    if (arch === "arm64") {
      return { path: "sqlean-macos-arm64", extension: "dylib" };
    }
    if (arch === "x86") {
      return { path: "sqlean-macos-x86", extension: "dylib" };
    }
  }
  // WINDOWS
  if (platform === "win32") {
    if (arch === "x64") {
      return { path: "sqlean-win-x64", extension: "dll" };
    }
  }
  // LINUX
  if (platform === "linux") {
    if (arch === "x86") {
      return { path: "sqlean-linux-x86", extension: "so" };
    }
  }
  throw new Error(
    `Unsupported platform ${platform} and arch ${arch}. \n These are not project limiatations, but the sqlean package is not available for your platform.`,
  );
};

const testDabasesFolder = `.test_dbs`;
const migrationsFolder = `${process.cwd()}/drizzle/migrations`;
/* c8 ignore next 3 */
if (!existsSync(`./${testDabasesFolder}`)) {
  mkdirSync(`./${testDabasesFolder}`);
}

const executeCommandPromise = (command: string) => {
  return new Promise<string>((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      /* c8 ignore next 4 */
      if (err) {
        console.error("ERROR", err);
        return reject(err);
      }
      /* c8 ignore next 4 */
      if (stderr) {
        console.error("STDERR", stderr);
        return reject(stderr);
      }
      return resolve(stdout);
    });
  });
};

const asyncLoadExtension = (db: Database, path: string) => {
  db.loadExtension(path, () => {});
};

const createDatabase = async () => {
  const databaseName = `${faker.string.uuid().replaceAll("-", "_")}`;
  const databasePath = `${process.cwd()}/${testDabasesFolder}/${databaseName}`;
  const command = `echo "CREATE TABLE IF NOT EXISTS SOME_TABLE (id INTEGER PRIMARY KEY);" | sqlite3 ${databasePath}`;
  const sqleanExtensionName = getSQLeanPackageToInstall();
  const sqleanExtensionPath = `${process.cwd()}/drizzle/extensions/${
    sqleanExtensionName.path
  }`;
  const command2 = `sqlite3 ${databasePath} ".load ${sqleanExtensionPath}"`;
  const db = new Sqlite3(databasePath);
  db.loadExtension(
    `${sqleanExtensionPath}/uuid.${sqleanExtensionName.extension}`,
  );
  db.close();

  await executeCommandPromise(command);
  await executeCommandPromise(command2);

  return databasePath;
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
  client;
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
