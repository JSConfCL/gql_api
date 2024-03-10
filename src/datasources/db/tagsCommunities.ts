import { relations } from "drizzle-orm";
import { primaryKey, pgTable, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { communitySchema, tagsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

// TAG—COMMUNITY
export const tagsToCommunitiesSchema = pgTable(
  "tags_communities",
  {
    id: uuid("id").notNull().defaultRandom().unique(),
    tagId: uuid("tag_id")
      .references(() => tagsSchema.id)
      .notNull(),
    communityId: uuid("community_id")
      .references(() => communitySchema.id)
      .notNull(),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey({ columns: [t.tagId, t.communityId] }),
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
