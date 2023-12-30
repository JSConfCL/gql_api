import { relations } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { communitySchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";

const usersToCommunitiesRoleEnum = ["admin", "member", "collaborator"] as const;
// USERS—COMMUNITIES—TABLE
export const usersToCommunitiesSchema = pgTable("users_communities", {
  userId: text("user_id").references(() => usersSchema.id),
  communityId: text("community_id").references(() => communitySchema.id),
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
