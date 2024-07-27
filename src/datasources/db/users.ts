import { relations } from "drizzle-orm";
import { jsonb, boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import {
  userTeamsSchema,
  userTicketsSchema,
  usersToCommunitiesSchema,
} from "./schema";
import {
  createdAndUpdatedAtFields,
  genderOptions,
  TypescriptEnumAsDBEnumOptions,
} from "./shared";

export enum UserStatusEnum {
  active = "active",
  inactive = "inactive",
  blocked = "blocked",
}

export enum PronounsEnum {
  heHim = "él/ellos",
  sheHer = "ella/ellas",
  theyThem = "elle/elles",
  other = "otro",
}

// USERS
export const usersSchema = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  externalId: text("externalId").unique().notNull(),
  name: text("name"),
  lastName: text("lastName"),
  bio: text("bio").default(""),
  email: text("email").unique().notNull(),
  gender: text("gender", {
    enum: genderOptions,
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

export const userRelations = relations(usersSchema, ({ many }) => ({
  usersToCommunities: many(usersToCommunitiesSchema),
  usersToTickets: many(userTicketsSchema),
  userTeams: many(userTeamsSchema),
}));

export type USER = z.infer<typeof selectUsersSchema>;

export const selectUsersSchema = createSelectSchema(usersSchema);
export const insertUsersSchema = createInsertSchema(usersSchema);
