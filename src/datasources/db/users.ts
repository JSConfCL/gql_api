import { relations } from "drizzle-orm";
import { blob, int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";
import { userTicketsSchema, usersToCommunitiesSchema } from "./schema";

// USERS
export const usersSchema = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  lastName: text("lastName"),
  bio: text("bio", { length: 1024 }).default(""),
  email: text("email"),
  gender: text("gender", {
    enum: [
      "male",
      "female",
      "transgender_male",
      "transgender_female",
      "non_binary",
      "genderqueer",
      "genderfluid",
      "agender",
      "two-spirit",
      "other",
      "prefer_not_to_say",
    ],
  }),
  genderOtherText: text("gender_other_text"),
  isSuperAdmin: int("isSuperAdmin", { mode: "boolean" }).default(false),
  emailVerified: int("emailVerified", { mode: "boolean" }),
  imageUrl: text("imageUrl"),
  username: text("username", { length: 64 }).unique().notNull(),
  twoFactorEnabled: int("twoFactorEnabled", { mode: "boolean" }),
  unsafeMetadata: blob("unsafeMetadata"),
  publicMetadata: blob("publicMetadata"),
  ...createdAndUpdatedAtFields,
});

export const userRelations = relations(usersSchema, ({ many }) => ({
  usersToCommunities: many(usersToCommunitiesSchema),
  usersToTickets: many(userTicketsSchema),
}));

export const selectUsersSchema = createSelectSchema(usersSchema);
export const insertUsersSchema = createInsertSchema(usersSchema);
