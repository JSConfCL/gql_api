import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  eventsToCommunitiesSchema,
  tagsToCommunitiesSchema,
  usersToCommunitiesSchema,
} from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

// COMMUNITY-TABLE
export const communitySchema = sqliteTable("communities", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  slug: text("slug", { length: 64 }).unique(),
  description: text("description", { length: 1024 }),
  status: text("status", { enum: ["active", "inactive"] })
    .default("inactive")
    .notNull(),
  ...createdAndUpdatedAtFields,
});

export const communityRelations = relations(communitySchema, ({ many }) => ({
  usersToCommunities: many(usersToCommunitiesSchema),
  tagsToCommunities: many(tagsToCommunitiesSchema),
  eventsToCommunities: many(eventsToCommunitiesSchema),
}));

export const selectCommunitySchema = createSelectSchema(communitySchema);
export const insertCommunitySchema = createInsertSchema(communitySchema, {
  name: (schema) => schema.name.min(3).max(64),
});
