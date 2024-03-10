import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
  eventsToTagsSchema,
  tagsToCommunitiesSchema,
  usersTagsSchema,
} from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

// TAGS-TABLE
export const tagsSchema = pgTable("tags", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
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
