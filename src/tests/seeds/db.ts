import { faker } from "@faker-js/faker";
import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { drizzle as postgresJSDrizzle } from "drizzle-orm/postgres-js";

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { Client, Pool } from "pg";
import postgres from "postgres";

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

const runMigrations = async (NEW_DATABASE_NAME: string) => {
  const url = `postgres://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${NEW_DATABASE_NAME}`;
  console.log("Conectandose a la BDD: ", url);
  const sql = postgres(url, {
    max: 1,
  });
  const db = postgresJSDrizzle(sql);
  console.log("EJECUTANDO MIGRACIONES");
  await migrate(db, {
    migrationsFolder: process.cwd() + "/drizzle/migrations",
  });
  console.log("MIGRACIONES EJECUTADAS");
};

const createDatabase = async (): Promise<string> => {
  const pool = new Client({
    port: Number(DATABASE_PORT),
    host: DATABASE_HOST,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
  });

  // Podriamos considerar usar un nombre menos random. Por ejemplo, el nombre del archivo de test parseado.
  // Asi podriamos facilmente ver los datos en el test q falla.
  // Pero por ahora, no lo veo necesario.
  const new_database = `__JSCHILE_TEST__${faker.string
    .uuid()
    .replaceAll("-", "_")}`;
  try {
    await pool.connect();
    console.log("DROPEANDO BDD ", new_database);
    await pool.query(`DROP DATABASE IF EXISTS ${new_database};`);
    console.log("BDD DROPEADA ", new_database);

    console.log("CREANDO BDD ", new_database);
    await pool.query(`CREATE DATABASE ${new_database};`);
    console.log("BDD CREADA ", new_database);

    console.log(
      "ASIGNANDO PERMISOS A BDD ",
      new_database + " PARA USUARIO ",
      DATABASE_USER,
    );
    await pool.query(
      `GRANT ALL PRIVILEGES ON DATABASE ${new_database} TO ${DATABASE_USER};`,
    );
    console.log(
      "PERMISOS ASIGNADOS A BDD ",
      new_database + " PARA USUARIO ",
      DATABASE_USER,
    );
    await pool.end();
    return new_database;
  } catch (e) {
    console.error(e);
    throw new Error(`Error creando base de datos: ${new_database}`);
  } finally {
    await pool.end();
  }
};

let drizzleCache: NodePgDatabase<Record<string, never>> | null = null;
// Nos aseguramos q los seeds no cambien entre ejecucio
export const getTestDB = async () => {
  if (drizzleCache) {
    console.log(
      "Retornando instancia de Drizzle ya creada. Si quieres crear una nueva instancia, llama a clearDatabase()",
    );
    return drizzleCache;
  }
  const database = await createDatabase();
  console.log("Conectandose a la BDD: ", database);
  await runMigrations(database);
  const client = new Pool({
    port: Number(DATABASE_PORT),
    host: DATABASE_HOST,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database,
  });
  // await client.connect();
  // Running a dummy query to ensure the connection is established
  console.log("Corriendo query de prueba");
  const result = await client.query("SELECT NOW()");
  console.log("Query de prueba corrida", result);
  console.log("Conectado a la BDD: ", database);
  drizzleCache = drizzle(client);
  return drizzleCache;
};

export const clearDatabase = () => {
  drizzleCache = null;
};
