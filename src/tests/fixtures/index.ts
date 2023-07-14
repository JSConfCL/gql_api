import { faker } from "@faker-js/faker";
import {
  userSchema,
  insertUserSchema,
  selectUserSchema,
} from "~/datasources/db/schema";
import { getTestDB } from "~/tests/fixtures/databaseHelper";
import { z } from "zod";
import { schema } from "~/schema";
import { Env } from "worker-configuration";
import { createYoga } from "graphql-yoga";
import { buildHTTPExecutor } from "@graphql-tools/executor-http";
import { initContextCache } from "@pothos/core";
import { parse } from "cookie";

const insertUserRequest = insertUserSchema.deepPartial();

export const executeGraphqlOperation = buildHTTPExecutor({
  fetch: createYoga<Env>({
    schema,
    context: async ({ request }) => {
      const JWT = parse(request.headers.get("cookie") ?? "")["TEST"];
      const DB = await getTestDB();
      return {
        ...initContextCache(),
        JWT,
        DB,
      };
    },
  }).fetch,
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
  const data = await testDB
    .insert(userSchema)
    .values(newUser)
    .returning()
    .get();
  return selectUserSchema.parse(data);
};
