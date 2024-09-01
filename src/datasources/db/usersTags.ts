import { relations } from "drizzle-orm";
import { primaryKey, sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { usersSchema, tagsSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

export enum AllowedUserTags {
  "DONOR" = "DONOR",
  "CORE_TEAM" = "CORE_TEAM",
  "DEV_TEAM" = "DEV_TEAM",
}

// USERS-TAGS
export const usersTagsSchema = sqliteTable(
  "users_tags",
  {
    id: uuid("id").notNull().unique(),
    tagId: uuid("tag_id")
      .references(() => tagsSchema.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => usersSchema.id)
      .notNull(),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey({ columns: [t.tagId, t.userId] }),
  }),
);

export const usersToTagsRelations = relations(usersTagsSchema, ({ one }) => ({
  user: one(usersSchema, {
    fields: [usersTagsSchema.userId],
    references: [usersSchema.id],
  }),
  tag: one(tagsSchema, {
    fields: [usersTagsSchema.tagId],
    references: [tagsSchema.id],
  }),
}));

export const selectUsersToTagsSchema = createSelectSchema(usersTagsSchema);

export const insertUsersToTagsSchema = createInsertSchema(usersTagsSchema);
