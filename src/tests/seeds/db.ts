import { faker } from "@faker-js/faker";
import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

if (!process.env.DATABASE_PORT || !Number(process.env.DATABASE_PORT)) {
  throw new Error("Missing process.env.DATABASE_PORT");
}
if (!process.env.DATABASE_HOST) {
  throw new Error("Missing process.env.DATABASE_HOST");
}
if (!process.env.DATABASE_USER) {
  throw new Error("Missing process.env.DATABASE_USER");
}
if (!process.env.DATABASE_PASSWORD) {
  throw new Error("Missing process.env.DATABASE_PASSWORD");
}
if (!process.env.DATABASE_NAME) {
  throw new Error("Missing process.env.DATABASE_NAME");
}

const createDatabase = async (): Promise<string> => {
  const client = new Client({
    port: Number(process.env.DATABASE_PORT),
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  // Podriamos considerar usar un nombre menos random. Por ejemplo, el nombre del archivo de test parseado.
  // Asi podriamos facilmente ver los datos en el test q falla.
  // Pero por ahora, no lo veo necesario.
  const new_database = `TEST_${faker.string.uuid().replaceAll("-", "_")}`;
  try {
    await client.connect();
    console.log("DROPEANDO BDD ", new_database);
    await client.query(`DROP DATABASE IF EXISTS ${new_database};`);
    console.log("BDD DROPEADA ", new_database);

    console.log("CREANDO BDD ", new_database);
    await client.query(`CREATE DATABASE ${new_database};`);
    await client.query(
      `GRANT ALL ON SCHEMA public TO ${process.env.DATABASE_USER!};`,
    );
    await client.query(`GRANT ALL ON SCHEMA public TO public;`);
    console.log("BDD CREADA ", new_database);
    return new_database;
  } catch (e) {
    console.error(e);
    throw new Error(`Error creando base de datos: ${new_database}`);
  } finally {
    await client.end();
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
  const client = new Client({
    port: Number(process.env.DATABASE_PORT),
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database,
  });
  await client.connect();
  // Running a dummy query to ensure the connection is established
  console.log("Corriendo query de prueba");
  const result = await client.query("SELECT NOW()");
  console.log("Query de prueba corrida", result);

  debugger;
  console.log("Conectado a la BDD: ", database);
  drizzleCache = drizzle(client);
  return drizzleCache;
};

export const clearDatabase = () => {
  drizzleCache = null;
};
