import { faker } from "@faker-js/faker";
import {
  usersSchema,
  insertUsersSchema,
  selectUsersSchema,
  insertCommunitySchema,
  communitySchema,
  selectCommunitySchema,
  insertUsersToCommunitiesSchema,
  usersToCommunitiesSchema,
  selectUsersToCommunitiesSchema,
} from "~/datasources/db/schema";
import { getTestDB } from "~/tests/fixtures/databaseHelper";
import { z } from "zod";
import { schema } from "~/schema";
import { Env } from "worker-configuration";
import { createYoga } from "graphql-yoga";
import { buildHTTPExecutor } from "@graphql-tools/executor-http";
import { initContextCache } from "@pothos/core";
import { parse } from "cookie";

const insertUserRequest = insertUsersSchema.deepPartial();

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
  partialNewUser?: Partial<z.infer<typeof insertUserRequest>>,
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
    username: partialNewUser?.username ?? faker.internet.userName(),
  } satisfies z.infer<typeof insertUsersSchema>;
  const newUser = insertUsersSchema.parse(possibleUser);
  const testDB = await getTestDB();
  const data = await testDB
    .insert(usersSchema)
    .values(newUser)
    .returning()
    .get();
  return selectUsersSchema.parse(data);
};

export const insertCommunity = async (
  partialNewCommunity?: Partial<z.infer<typeof insertCommunitySchema>>,
) => {
  const possibleCommunity = {
    id: partialNewCommunity?.id ?? faker.string.uuid(),
    name: partialNewCommunity?.name ?? faker.company.name(),
    status: partialNewCommunity?.status ?? "active",
    createdAt: partialNewCommunity?.createdAt,
    updatedAt: partialNewCommunity?.updatedAt,
    description: partialNewCommunity?.description ?? faker.lorem.paragraph(),
  } satisfies z.infer<typeof insertCommunitySchema>;
  const newCommunity = insertCommunitySchema.parse(possibleCommunity);
  const testDB = await getTestDB();
  const data = await testDB
    .insert(communitySchema)
    .values(newCommunity)
    .returning()
    .get();
  return selectCommunitySchema.parse(data);
};

export const insertUserToCommunity = async (
  partialNewUserToCommunity: z.infer<typeof insertUsersToCommunitiesSchema>,
) => {
  const possibleUserToCommunity = {
    userId: partialNewUserToCommunity?.userId,
    communityId: partialNewUserToCommunity?.communityId,
    role: partialNewUserToCommunity?.role ?? "admin",
  } satisfies z.infer<typeof insertUsersToCommunitiesSchema>;
  const newUserToCommunity = insertUsersToCommunitiesSchema.parse(
    possibleUserToCommunity,
  );
  const testDB = await getTestDB();
  const data = await testDB
    .insert(usersToCommunitiesSchema)
    .values(newUserToCommunity)
    .returning()
    .get();
  return selectUsersToCommunitiesSchema.parse(data);
};
