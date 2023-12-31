import { relations } from "drizzle-orm";
import { jsonb, boolean, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields, genderOptions } from "./shared";
import { userTicketsSchema, usersToCommunitiesSchema } from "./schema";

// USERS
export const usersSchema = pgTable("users", {
  id: text("id").primaryKey().notNull().unique(),
  name: text("name"),
  lastName: text("lastName"),
  bio: text("bio").default(""),
  email: text("email"),
  gender: text("gender", {
    enum: genderOptions,
  }),
  genderOtherText: text("gender_other_text"),
  isSuperAdmin: boolean("isSuperAdmin").default(false),
  emailVerified: boolean("emailVerified"),
  imageUrl: text("imageUrl"),
  username: text("username").unique().notNull(),
  twoFactorEnabled: boolean("twoFactorEnabled"),
  unsafeMetadata: jsonb("unsafeMetadata"),
  publicMetadata: jsonb("publicMetadata"),
  ...createdAndUpdatedAtFields,
});

export const userRelations = relations(usersSchema, ({ many }) => ({
  usersToCommunities: many(usersToCommunitiesSchema),
  usersToTickets: many(userTicketsSchema),
}));

export const selectUsersSchema = createSelectSchema(usersSchema);
export const insertUsersSchema = createInsertSchema(usersSchema);
