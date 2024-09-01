import { relations } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import {
  userDataSchema,
  usersToCommunitiesSchema,
  userTeamsSchema,
  userTicketsSchema,
} from "./schema";
import {
  createdAndUpdatedAtFields,
  GenderOptionsEnum,
  TypescriptEnumAsDBEnumOptions,
  boolean,
  uuid,
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
export const usersSchema = sqliteTable(
  "users",
  {
    id: uuid("id").primaryKey().notNull(),
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
    publicMetadata: text("publicMetadata", {
      mode: "json",
    }),
    ...createdAndUpdatedAtFields,
  },
  (table) => ({
    emailIndex: index("users_email_index").on(table.email),
    nameIndex: index("users_name_index").on(table.name),
    lastNameIndex: index("users_last_name_index").on(table.lastName),
    userNameIndex: index("users_username_index").on(table.username),
  }),
);

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
