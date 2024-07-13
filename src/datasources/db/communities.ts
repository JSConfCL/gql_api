import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
  eventsToCommunitiesSchema,
  tagsToCommunitiesSchema,
  usersToCommunitiesSchema,
} from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export const communityStatusEnum = ["active", "inactive"] as const;

// COMMUNITY-TABLE
export const communitySchema = pgTable("communities", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  logoImageSanityRef: text("logo_image_sanity_ref"), // these are sanity image IDs
  bannerImageSanityRef: text("banner_image_sanity_ref"), // these are sanity image IDs
  status: text("status", { enum: communityStatusEnum })
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
  name: (schema) => schema.name.min(2).max(64),
});
