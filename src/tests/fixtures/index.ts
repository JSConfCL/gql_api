import { faker } from "@faker-js/faker";
import {
  user,
  insertUserSchema,
  selectUserSchema,
} from "~/datasources/db/schema";
import { getTestDB } from "~/tests/fixtures/databaseHelper";
import { z } from "zod";
import { schema } from "~/schema";
import { Env } from "worker-configuration";
import { createYoga } from "graphql-yoga";
import { buildHTTPExecutor } from "@graphql-tools/executor-http";

const insertUserRequest = insertUserSchema.deepPartial();

export const executeGraphqlOperation = buildHTTPExecutor({
  fetch: createYoga<Env>({ schema }).fetch,
});

export const insertUser = async (
  partialNewUser?: z.infer<typeof insertUserRequest>,
) => {
  // TODO: (felipe) Mejorar esto, crear una abstraccion mas simple de usar, que
  // sea cosa de pasarle un modelo y listo.
  const possibleUser = {
    id: partialNewUser?.id ?? faker.string.uuid(),
    externalId: partialNewUser?.email ?? faker.string.uuid(),
    email: partialNewUser?.email,
    createdAt: partialNewUser?.createdAt,
    name: partialNewUser?.name,
    updatedAt: partialNewUser?.updatedAt,
  } satisfies z.infer<typeof insertUserSchema>;
  const newUser = insertUserSchema.parse(possibleUser);
  const testDB = await getTestDB();
  const data = await testDB.insert(user).values(newUser).returning().get();
  return selectUserSchema.parse(data);
};
