import { relations } from "drizzle-orm";
import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { usersSchema, tagsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export enum AllowedUserTags {
  "DONOR" = "DONOR",
  "CORE_TEAM" = "CORE_TEAM",
  "DEV_TEAM" = "DEV_TEAM",
}

// USERS-TAGS
export const usersTags = sqliteTable(
  "users_tags",
  {
    tagId: text("tag_id").references(() => tagsSchema.id),
    userId: text("user_id").references(() => usersSchema.id),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey(t.tagId, t.userId),
  }),
);

export const usersToTagsRelations = relations(usersTags, ({ one }) => ({
  community: one(usersSchema, {
    fields: [usersTags.userId],
    references: [usersSchema.id],
  }),
  tag: one(tagsSchema, {
    fields: [usersTags.tagId],
    references: [tagsSchema.id],
  }),
}));

export const selectUsersToTags = createSelectSchema(usersTags);

export const insertUsersToTags = createInsertSchema(usersTags);
