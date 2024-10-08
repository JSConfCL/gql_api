import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { communitySchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";

const usersToCommunitiesRoleEnum = ["admin", "member", "collaborator"] as const;

// USERS—COMMUNITIES—TABLE
export const usersToCommunitiesSchema = pgTable("users_communities", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id").references(() => usersSchema.id),
  communityId: uuid("community_id").references(() => communitySchema.id),
  role: text("role", { enum: usersToCommunitiesRoleEnum }).default("member"),
  ...createdAndUpdatedAtFields,
});

export const usersToCommunitiesRelations = relations(
  usersToCommunitiesSchema,
  ({ one }) => ({
    community: one(communitySchema, {
      fields: [usersToCommunitiesSchema.communityId],
      references: [communitySchema.id],
    }),
    user: one(usersSchema, {
      fields: [usersToCommunitiesSchema.userId],
      references: [usersSchema.id],
    }),
  }),
);

export const selectUsersToCommunitiesSchema = createSelectSchema(
  usersToCommunitiesSchema,
);

export const insertUsersToCommunitiesSchema = createInsertSchema(
  usersToCommunitiesSchema,
);

export type SelectUsersToCommunitiesSchema = z.infer<
  typeof selectUsersToCommunitiesSchema
>;

export type InsertUsersToCommunitiesSchema = z.infer<
  typeof insertUsersToCommunitiesSchema
>;
