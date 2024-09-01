import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
  eventsToCommunitiesSchema,
  tagsToCommunitiesSchema,
  usersToCommunitiesSchema,
} from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

export const communityStatusEnum = ["active", "inactive"] as const;

// COMMUNITY-TABLE
export const communitySchema = sqliteTable("communities", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  logoImageSanityRef: text("logo_image_sanity_ref"), // these are sanity image IDs
  bannerImageSanityRef: text("banner_image_sanity_ref"), // these are sanity image IDs
  paymentSuccessRedirectURL: text("payment_success_redirect_url"),
  paymentCancelRedirectURL: text("payment_cancel_redirect_url"),
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
