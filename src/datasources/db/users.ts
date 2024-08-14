import { relations } from "drizzle-orm";
import {
  jsonb,
  boolean,
  pgTable,
  text,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import {
  userTeamsSchema,
  userTicketsSchema,
  usersToCommunitiesSchema,
} from "./schema";
import {
  createdAndUpdatedAtFields,
  GenderOptionsEnum,
  TypescriptEnumAsDBEnumOptions,
} from "./shared";

export enum UserStatusEnum {
  active = "active",
  inactive = "inactive",
  blocked = "blocked",
  empty = "",
}

export enum PronounsEnum {
  heHim = "él/ellos",
  sheHer = "ella/ellas",
  theyThem = "elle/elles",
  other = "otro",
  empty = "",
}

// USERS
export const usersSchema = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  externalId: text("externalId"),
  name: text("name"),
  lastName: text("lastName"),
  bio: text("bio").default(""),
  email: text("email").unique().notNull(),
  gender: text("gender", {
    enum: TypescriptEnumAsDBEnumOptions(GenderOptionsEnum),
  }),
  pronouns: text("pronouns", {
    enum: TypescriptEnumAsDBEnumOptions(PronounsEnum),
  }),
  status: text("status", {
    enum: TypescriptEnumAsDBEnumOptions(UserStatusEnum),
  }).default(UserStatusEnum.inactive),
  genderOtherText: text("gender_other_text"),
  isSuperAdmin: boolean("isSuperAdmin").default(false).notNull(),
  isEmailVerified: boolean("emailVerified").default(false).notNull(),
  imageUrl: text("imageUrl"),
  username: text("username").unique().notNull(),
  publicMetadata: jsonb("publicMetadata"),
  ...createdAndUpdatedAtFields,
});

export const userRelations = relations(usersSchema, ({ many, one }) => ({
  usersToCommunities: many(usersToCommunitiesSchema),
  usersToTickets: many(userTicketsSchema),
  userTeams: many(userTeamsSchema),
  userData: one(userDataSchema, {
    fields: [usersSchema.id],
    references: [userDataSchema.userId],
  }),
}));

export type USER = z.infer<typeof selectUsersSchema>;

export const selectUsersSchema = createSelectSchema(usersSchema);

export const insertUsersSchema = createInsertSchema(usersSchema);

export const updateUsersSchema = insertUsersSchema
  .pick({
    name: true,
    lastName: true,
    bio: true,
    pronouns: true,
    gender: true,
    genderOtherText: true,
    username: true,
  })
  .partial();

export const allowedUserUpdateForAuth = insertUsersSchema
  .pick({
    name: true,
    lastName: true,
    bio: true,
    pronouns: true,
    // gender: true,
    // genderOtherText: true,
    username: true,
    externalId: true,
    imageUrl: true,
    isEmailVerified: true,
    publicMetadata: true,
    updatedAt: true,
    status: true,
  })
  .partial();

export const userDataSchema = pgTable(
  "user_data",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id").references(() => usersSchema.id),
    countryOfResidence: text("country_of_residence").notNull(),
    city: text("city").notNull(),
    worksInOrganization: boolean("works_in_organization").notNull(),
    organizationName: text("organization_name"),
    roleInOrganization: text("role_in_organization"),
    ...createdAndUpdatedAtFields,
  },
  (table) => ({
    userIdIndex: uniqueIndex("user_id_index").on(table.userId),
  }),
);

export const userDataRelations = relations(userDataSchema, ({ one }) => ({
  user: one(usersSchema, {
    fields: [userDataSchema.userId],
    references: [usersSchema.id],
  }),
}));

export const selectUserDataSchema = createSelectSchema(userDataSchema);
