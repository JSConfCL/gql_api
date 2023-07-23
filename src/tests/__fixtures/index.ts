/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from "@faker-js/faker";
import { buildHTTPExecutor } from "@graphql-tools/executor-http";
import { ExecutionRequest } from "@graphql-tools/utils";
import { initContextCache } from "@pothos/core";
import { parse } from "cookie";
import { eq } from "drizzle-orm";
import { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-zod";
import { type ExecutionResult } from "graphql";
import { createYoga } from "graphql-yoga";
import { Env } from "worker-configuration";
import { ZodType, z } from "zod";
import {
  insertCommunitySchema,
  insertEventsSchema,
  insertEventsToTagsSchema,
  insertTagsSchema,
  insertUsersSchema,
  insertUsersToCommunitiesSchema,
  selectCommunitySchema,
  selectEventsSchema,
  selectEventsToTagsSchema,
  selectTagsSchema,
  selectUsersSchema,
  selectUsersToCommunitiesSchema,
  selectEventsToCommunitiesSchema,
  insertEventsToCommunitiesSchema,
} from "~/datasources/db/schema";
import {
  communitySchema,
  eventsSchema,
  eventsToCommunitiesSchema,
  eventsToTagsSchema,
  tagsSchema,
  usersSchema,
  usersToCommunitiesSchema,
} from "~/datasources/db/tables";
import { schema } from "~/schema";
import { getTestDB } from "~/tests/__fixtures/databaseHelper";

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

async function findById<D extends SQLiteTableWithColumns<any>>(
  dbSchema: D,
  id: string | undefined,
) {
  const testDB = await getTestDB();
  if (!id) {
    throw new Error(`FindById cannot be called without an id`);
  }
  const data = await testDB
    .select()
    .from(dbSchema)
    .where((t) => eq(t.id, id))
    .get();
  return createSelectSchema(dbSchema).parse(data);
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
export const findUserById = async (id?: string) => findById(usersSchema, id);

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
export const findCommunityById = async (id?: string) =>
  findById(communitySchema, id);

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

export const insertEventToCommunity = async (
  possibleInput: z.infer<typeof insertEventsToCommunitiesSchema>,
) => {
  return insertOne(
    insertEventsToCommunitiesSchema,
    selectEventsToCommunitiesSchema,
    eventsToCommunitiesSchema,
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

export const insertEvent = async (
  partialInput?: Partial<z.infer<typeof insertEventsSchema>>,
) => {
  const possibleInput = {
    id: partialInput?.id ?? faker.string.uuid(),
    name: partialInput?.name ?? faker.company.name(),
    description: partialInput?.description ?? faker.lorem.paragraph(),
    visibility: partialInput?.visibility ?? "public",
    status: partialInput?.status ?? "active",
    startDateTime: partialInput?.startDateTime ?? faker.date.future(),
    endDateTime: partialInput?.endDateTime ?? faker.date.future(),
  } satisfies z.infer<typeof insertEventsSchema>;
  return insertOne(
    insertEventsSchema,
    selectEventsSchema,
    eventsSchema,
    possibleInput,
  );
};
export const findEventById = async (id?: string) => findById(eventsSchema, id);

export const insertEventTag = async (
  partialInput: z.infer<typeof insertEventsToTagsSchema>,
) => {
  const possibleInput = {
    eventId: partialInput?.eventId,
    tagId: partialInput?.tagId,
  } satisfies z.infer<typeof insertEventsToTagsSchema>;
  return insertOne(
    insertEventsToTagsSchema,
    selectEventsToTagsSchema,
    eventsToTagsSchema,
    possibleInput,
  );
};
