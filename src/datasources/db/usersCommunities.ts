import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { communitySchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";

const usersToCommunitiesRoleEnum = ["admin", "member", "collaborator"] as const;
// USERS—COMMUNITIES—TABLE
export const usersToCommunitiesSchema = pgTable("users_communities", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  oldUserId: text("old_user_id").references(() => usersSchema.oldId),
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
      fields: [usersToCommunitiesSchema.oldUserId],
      references: [usersSchema.oldId],
    }),
  }),
);

export const selectUsersToCommunitiesSchema = createSelectSchema(
  usersToCommunitiesSchema,
);
export const insertUsersToCommunitiesSchema = createInsertSchema(
  usersToCommunitiesSchema,
);
