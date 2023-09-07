import { relations } from "drizzle-orm";
import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { communitySchema, tagsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

// TAG—COMMUNITY
export const tagsToCommunitiesSchema = sqliteTable(
  "tags_communities",
  {
    tagId: text("tag_id").references(() => tagsSchema.id),
    communityId: text("community_id").references(() => communitySchema.id),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey(t.tagId, t.communityId),
  }),
);

export const tagsToCommunitiesRelations = relations(
  tagsToCommunitiesSchema,
  ({ one }) => ({
    community: one(communitySchema, {
      fields: [tagsToCommunitiesSchema.communityId],
      references: [communitySchema.id],
    }),
    tag: one(tagsSchema, {
      fields: [tagsToCommunitiesSchema.tagId],
      references: [tagsSchema.id],
    }),
  }),
);

export const selectTagsToCommuntiesSchema = createSelectSchema(
  tagsToCommunitiesSchema,
);
export const insertTagsToCommunitiesSchema = createInsertSchema(
  tagsToCommunitiesSchema,
);
