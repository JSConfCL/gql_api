/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from "@faker-js/faker";
import { authZEnvelopPlugin } from "@graphql-authz/envelop-plugin";
import { buildHTTPExecutor } from "@graphql-tools/executor-http";
import { ExecutionRequest } from "@graphql-tools/utils";
import { initContextCache } from "@pothos/core";
import { eq } from "drizzle-orm";
import { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-zod";
import { type ExecutionResult } from "graphql";
import { createYoga } from "graphql-yoga";
import { Env } from "worker-configuration";
import { ZodType, z } from "zod";
import * as rules from "~/authz";
import {
  communitySchema,
  companiesSchema,
  eventsSchema,
  eventsToCommunitiesSchema,
  eventsToTagsSchema,
  eventsToUsersSchema,
  insertCommunitySchema,
  insertCompaniesSchema,
  insertEventsSchema,
  insertEventsToCommunitiesSchema,
  insertEventsToTagsSchema,
  insertEventsToUsersSchema,
  insertTagsSchema,
  insertTicketSchema,
  insertUserTicketsSchema,
  insertUsersSchema,
  insertUsersToCommunitiesSchema,
  insertWorkEmailSchema,
  selectCommunitySchema,
  selectCompaniesSchema,
  selectEventsSchema,
  selectEventsToCommunitiesSchema,
  selectEventsToTagsSchema,
  selectEventsToUsersSchema,
  selectTagsSchema,
  selectTicketSchema,
  selectUserTicketsSchema,
  selectUsersSchema,
  selectUsersToCommunitiesSchema,
  selectWorkEmailSchema,
  tagsSchema,
  ticketsSchema,
  userTicketsSchema,
  usersSchema,
  usersToCommunitiesSchema,
  workEmailSchema,
} from "~/datasources/db/schema";
import {
  TicketApprovalStatus,
  TicketPaymentStatus,
  TicketRedemptionStatus,
  TicketStatus,
} from "~/generated/types";
import { schema } from "~/schema";
import { getTestDB } from "~/tests/__fixtures/databaseHelper";

const insertUserRequest = insertUsersSchema.deepPartial();

const createExecutor = (user?: Awaited<ReturnType<typeof insertUser>>) =>
  buildHTTPExecutor({
    fetch: createYoga<Env>({
      schema,
      context: async () => {
        const DB = await getTestDB();
        return {
          ...initContextCache(),
          DB,
          USER: user ? user : undefined,
        };
      },
      plugins: [authZEnvelopPlugin({ rules })],
    }).fetch,
  });

export const executeGraphqlOperation = <
  TResult,
  TVariables extends Record<string, any> = Record<string, any>,
>(
  params: ExecutionRequest<TVariables, unknown, unknown, undefined, unknown>,
): Promise<ExecutionResult<TResult>> => {
  const executor = createExecutor();
  // @ts-expect-error This is ok. Executor returns a promise with they types passed
  return executor(params);
};

export const executeGraphqlOperationAsUser = <
  TResult,
  TVariables extends Record<string, any> = Record<string, any>,
>(
  params: ExecutionRequest<TVariables, unknown, unknown, undefined, unknown>,
  user: Awaited<ReturnType<typeof insertUser>>,
): Promise<ExecutionResult<TResult>> => {
  const executor = createExecutor(user);
  // @ts-expect-error This error is ok. Executor returns a promise with they types passed
  return executor(params);
};

export const executeGraphqlOperationAsSuperAdmin = async <
  TResult,
  TVariables extends Record<string, any> = Record<string, any>,
>(
  params: ExecutionRequest<TVariables, unknown, unknown, undefined, unknown>,
): Promise<ExecutionResult<TResult>> => {
  const user = await insertUser({ isSuperAdmin: true });
  const executor = createExecutor(user);
  // @ts-expect-error This error is ok. Executor returns a promise with they types passed
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
  // ads
  const possibleInput = {
    id: partialInput?.id ?? faker.string.uuid(),
    email: partialInput?.email,
    createdAt: partialInput?.createdAt,
    name: partialInput?.name,
    updatedAt: partialInput?.updatedAt,
    username: partialInput?.username ?? faker.internet.userName(),
    isSuperAdmin: partialInput?.isSuperAdmin ?? false,
    bio: partialInput?.bio ?? faker.lorem.paragraph(),
    deletedAt: partialInput?.deletedAt,
    emailVerified: partialInput?.emailVerified ?? false,
    lastName: partialInput?.lastName ?? faker.person.lastName(),
    publicMetadata: partialInput?.publicMetadata ?? JSON.stringify({}),
    twoFactorEnabled: partialInput?.twoFactorEnabled ?? false,
    unsafeMetadata: partialInput?.unsafeMetadata ?? JSON.stringify({}),
    imageUrl: partialInput?.imageUrl,
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

export const insertUserToEvent = async (
  partialInput: z.infer<typeof insertEventsToUsersSchema>,
) => {
  const possibleInput = {
    userId: partialInput?.userId,
    eventId: partialInput?.eventId,
    role: partialInput?.role ?? "admin",
  } satisfies z.infer<typeof insertEventsToUsersSchema>;
  return insertOne(
    insertEventsToUsersSchema,
    selectEventsToUsersSchema,
    eventsToUsersSchema,
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

export const insertTicketTemplate = async (
  partialInput: Partial<z.infer<typeof insertTicketSchema>>,
) => {
  const possibleInput = {
    id: partialInput?.id ?? faker.string.uuid(),
    eventId: partialInput.eventId ?? faker.string.uuid(),
    name: partialInput?.name ?? faker.company.name(),
    startDateTime: partialInput?.startDateTime ?? faker.date.future(),
    endDateTime: partialInput?.endDateTime ?? faker.date.future(),
    requiresApproval: partialInput?.requiresApproval ?? false,
  } satisfies z.infer<typeof insertTicketSchema>;

  return insertOne(
    insertTicketSchema,
    selectTicketSchema,
    ticketsSchema,
    possibleInput,
  );
};

export const insertTicket = async (
  partialInput: Omit<z.infer<typeof insertUserTicketsSchema>, "id"> & {
    id?: string;
  },
) => {
  const possibleInput = {
    id: partialInput?.id ?? faker.string.uuid(),
    userId: partialInput?.userId,
    ticketTemplateId: partialInput.ticketTemplateId,
    approvalStatus:
      partialInput?.approvalStatus ?? TicketApprovalStatus.Pending,
    paymentStatus: partialInput?.paymentStatus ?? TicketPaymentStatus.Unpaid,
    redemptionStatus:
      partialInput?.redemptionStatus ?? TicketRedemptionStatus.Pending,
    status: partialInput?.status ?? TicketStatus.Cancelled,
  } satisfies z.infer<typeof insertUserTicketsSchema>;

  return insertOne(
    insertUserTicketsSchema,
    selectUserTicketsSchema,
    userTicketsSchema,
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

export const insertCompany = async (
  partialInput?: Partial<z.infer<typeof insertCompaniesSchema>>,
) => {
  const possibleInput = {
    id: partialInput?.id ?? faker.string.uuid(),
    name: partialInput?.name ?? faker.company.name(),
    description: partialInput?.description ?? faker.lorem.paragraph(),
    domain: partialInput?.domain ?? faker.internet.domainName(),
    logo: partialInput?.logo,
    website: partialInput?.website,
    status: partialInput?.status,
    createdAt: partialInput?.createdAt,
    updatedAt: partialInput?.updatedAt,
    deletedAt: partialInput?.deletedAt,
  } satisfies z.infer<typeof insertCompaniesSchema>;
  return insertOne(
    insertCompaniesSchema,
    selectCompaniesSchema,
    companiesSchema,
    possibleInput,
  );
};

export const insertWorkEmail = async (
  partialInput?: Partial<z.infer<typeof insertWorkEmailSchema>>,
) => {
  const possibleInput = {
    id: partialInput?.id ?? faker.string.uuid(),
    userId: partialInput?.userId ?? faker.string.uuid(),
    workEmail: partialInput?.workEmail ?? faker.internet.email(),
    confirmationToken: partialInput?.confirmationToken,
    isConfirmed: partialInput?.isConfirmed,
    confirmationDate: partialInput?.confirmationDate,
    companyId: partialInput?.companyId,
    createdAt: partialInput?.createdAt,
    updatedAt: partialInput?.updatedAt,
  } satisfies z.infer<typeof insertWorkEmailSchema>;
  return insertOne(
    insertWorkEmailSchema,
    selectWorkEmailSchema,
    workEmailSchema,
    possibleInput,
  );
};
