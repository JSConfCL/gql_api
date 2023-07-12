import { faker } from "@faker-js/faker";
import { user } from "~/datasources/db/schema";
import { InsertUser } from "~/datasources/db/types";
import { getTestDB } from "~/tests/seeds/db";

// Nos aseguramos q los seeds no cambien entre ejecuciones
faker.seed(123456);

export const insertUser = async (partialNewUser: Partial<InsertUser> = {}) => {
  // TODO: (felipe) Mejorar esto, crear una abstraccion mas simple de usar, que
  // sea cosa de pasarle un modelo y listo.
  const newUser = {
    externalId: faker.string.uuid(),
    createdAt: partialNewUser.createdAt,
    updatedAt: partialNewUser.updatedAt,
    name: partialNewUser.name,
    email: partialNewUser.email,
  } satisfies InsertUser;
  const testDB = await getTestDB();
  const data = await testDB.insert(user).values(newUser).returning().execute();
  return data[0];
};
