import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { type ExecutionResult, print } from "graphql";
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
  insertTagsSchema,
  tagsSchema,
  selectTagsSchema,
} from "~/datasources/db/schema";
import { getTestDB } from "~/tests/__fixtures/databaseHelper";
import { ZodType, z } from "zod";
import { schema } from "~/schema";
import { Env } from "worker-configuration";
import { createYoga } from "graphql-yoga";
import { buildHTTPExecutor } from "@graphql-tools/executor-http";
import { initContextCache } from "@pothos/core";
import { parse } from "cookie";
import { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { AsyncExecutor, ExecutionRequest } from "@graphql-tools/utils";

const insertUserRequest = insertUsersSchema.deepPartial();

const executor = buildHTTPExecutor({
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
export const executeGraphqlOperation = <
  TResult,
  TVariables extends Record<string, any> = Record<string, any>,
>(
  params: ExecutionRequest<TVariables, unknown, unknown, undefined, unknown>,
): Promise<ExecutionResult<TResult>> => {
  // @ts-expect-error This is ok. Executor returns a promise with they types passed
  return executor(params);
};

async function insertOne<
  I extends ZodType<any, any, any>,
  S extends ZodType<any, any, any>,
  D extends SQLiteTableWithColumns<any>,
>(
  insertZod: I,
  selectZod: S,
  dbSchema: D,
  possibleInput: z.infer<I>,
): Promise<S["_type"]> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const newInput = insertZod.parse(possibleInput);
  const testDB = await getTestDB();
  const data = await testDB
    .insert(dbSchema)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    .values(newInput)
    .returning()
    .get();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return selectZod.parse(data);
}

export const insertUser = async (
  partialInput?: Partial<z.infer<typeof insertUserRequest>>,
) => {
  const possibleInput = {
    id: partialInput?.id ?? faker.string.uuid(),
    externalId: partialInput?.email ?? faker.string.uuid(),
    email: partialInput?.email,
    createdAt: partialInput?.createdAt,
    name: partialInput?.name,
    updatedAt: partialInput?.updatedAt,
    username: partialInput?.username ?? faker.internet.userName(),
  } satisfies z.infer<typeof insertUsersSchema>;
  return insertOne(
    insertUsersSchema,
    selectUsersSchema,
    usersSchema,
    possibleInput,
  );
};

export const insertCommunity = async (
  partialInput?: Partial<z.infer<typeof insertCommunitySchema>>,
) => {
  const possibleInput = {
    id: partialInput?.id ?? faker.string.uuid(),
    name: partialInput?.name ?? faker.company.name(),
    status: partialInput?.status ?? "active",
    createdAt: partialInput?.createdAt,
    updatedAt: partialInput?.updatedAt,
    description: partialInput?.description ?? faker.lorem.paragraph(),
  } satisfies z.infer<typeof insertCommunitySchema>;
  return insertOne(
    insertCommunitySchema,
    selectCommunitySchema,
    communitySchema,
    possibleInput,
  );
};

export const insertUserToCommunity = async (
  partialInput: z.infer<typeof insertUsersToCommunitiesSchema>,
) => {
  const possibleInput = {
    userId: partialInput?.userId,
    communityId: partialInput?.communityId,
    role: partialInput?.role ?? "admin",
  } satisfies z.infer<typeof insertUsersToCommunitiesSchema>;
  return insertOne(
    insertUsersToCommunitiesSchema,
    selectUsersToCommunitiesSchema,
    usersToCommunitiesSchema,
    possibleInput,
  );
};

export const insertTag = async (
  partialInput?: Partial<z.infer<typeof insertTagsSchema>>,
) => {
  const possibleInput = {
    id: partialInput?.id ?? faker.string.uuid(),
    name: partialInput?.name ?? faker.company.name(),
    description: partialInput?.description ?? faker.lorem.paragraph(),
  } satisfies z.infer<typeof insertTagsSchema>;
  return insertOne(
    insertTagsSchema,
    selectTagsSchema,
    tagsSchema,
    possibleInput,
  );
};
