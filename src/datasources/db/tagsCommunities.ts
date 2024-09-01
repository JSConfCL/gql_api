import { relations } from "drizzle-orm";
import { primaryKey, sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { communitySchema, tagsSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

// TAG—COMMUNITY
export const tagsToCommunitiesSchema = sqliteTable(
  "tags_communities",
  {
    id: uuid("id").notNull().unique(),
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
