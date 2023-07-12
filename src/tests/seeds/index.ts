import { faker } from "@faker-js/faker";
import { user insertUserSchema } from "~/datasources/db/schema";
import { getTestDB } from "~/tests/seeds/db";
import { z } from "zod";

// Nos aseguramos q los seeds no cambien entre ejecuciones
faker.seed(123456);

const insertUserRequest = insertUserSchema.deepPartial();

export const insertUser = async (
  partialNewUser: z.infer<typeof insertUserRequest>,
) => {
  // TODO: (felipe) Mejorar esto, crear una abstraccion mas simple de usar, que
  // sea cosa de pasarle un modelo y listo.
  const possibleUser = {
    externalId: partialNewUser.email ?? faker.string.uuid(),
    id: partialNewUser.id ?? faker.string.uuid(),
    email: partialNewUser.email,
    createdAt: partialNewUser.createdAt,
    name: partialNewUser.name,
    updatedAt: partialNewUser.updatedAt,
  } satisfies z.infer<typeof insertUserSchema>;
  const newUser = insertUserSchema.parse(possibleUser)
  const testDB = await getTestDB();
  const data = await testDB.insert(user).values(newUser).run()
  return data[0];
};
