import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
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
export const usersSchema = pgTable(
  "users",
  {
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
  },
  (table) => ({
    emailIndex: index("users_email_index")
      .using("gin", table.email)
      .concurrently(),
    nameIndex: index("users_name_index")
      .using("gin", table.name)
      .concurrently(),
    lastNameIndex: index("users_last_name_index")
      .using("gin", table.lastName)
      .concurrently(),
    userNameIndex: index("users_username_index")
      .using("gin", table.username)
      .concurrently(),
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
