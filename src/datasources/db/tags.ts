import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
  eventsToTagsSchema,
  tagsToCommunitiesSchema,
  usersTagsSchema,
} from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

// TAGS-TABLE
export const tagsSchema = sqliteTable("tags", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name").notNull().unique(),
  description: text("description"),
  ...createdAndUpdatedAtFields,
});

export const tagsRelations = relations(tagsSchema, ({ many }) => ({
  tagsToCommunities: many(tagsToCommunitiesSchema),
  tagsToEvents: many(eventsToTagsSchema),
  tagsToUsers: many(usersTagsSchema),
}));

export const selectTagsSchema = createSelectSchema(tagsSchema);

export const insertTagsSchema = createInsertSchema(tagsSchema);
