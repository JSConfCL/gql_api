import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// USERS
export const usersSchema = sqliteTable(
  "users",
  {
    id: text("id").unique().notNull(),
    name: text("name"),
    bio: text("bio", { length: 1024 }),
    email: text("email"),
    username: text("username", { length: 64 }).unique().notNull(),
    externalId: text("external_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
      sql`current_timestamp`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  },
  (t) => ({
    primary_key: primaryKey(t.id),
  }),
);
export const selectUsersSchema = createSelectSchema(usersSchema);
export const insertUsersSchema = createInsertSchema(usersSchema);
export const userRelations = relations(usersSchema, ({ many }) => ({
  usersToCommunities: many(usersToCommunitiesSchema),
}));

// COMMUNITY
export const communitySchema = sqliteTable(
  "communities",
  {
    id: text("id").unique().notNull(),
    name: text("name").notNull(),
    slug: text("slug", { length: 64 }).unique(),
    description: text("description", { length: 1024 }),
    status: text("status", { enum: ["active", "inactive"] })
      .default("inactive")
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
      sql`current_timestamp`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  },
  (t) => ({
    primary_key: primaryKey(t.id),
  }),
);
export const selectCommunitySchema = createSelectSchema(communitySchema);
export const insertCommunitySchema = createInsertSchema(communitySchema);
export const communityRelations = relations(communitySchema, ({ many }) => ({
  usersToCommunities: many(usersToCommunitiesSchema),
  tagsToCommunities: many(tagsToCommunitiesSchema),
}));

// USER—COMMUNITY—ROLES
export const usersToCommunitiesSchema = sqliteTable(
  "users_communities",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersSchema.id),
    communityId: text("community_id")
      .notNull()
      .references(() => communitySchema.id),
    role: text("role", { enum: ["admin", "member"] })
      .default("member")
      .notNull(),
  },
  (t) => ({
    primary_key: primaryKey(t.userId, t.communityId),
  }),
);
export const selectUsersToCommunitiesSchema = createSelectSchema(
  usersToCommunitiesSchema,
);
export const insertUsersToCommunitiesSchema = createInsertSchema(
  usersToCommunitiesSchema,
);
export const usersToCommunitiesRelations = relations(
  usersToCommunitiesSchema,
  ({ one }) => ({
    community: one(communitySchema, {
      fields: [usersToCommunitiesSchema.communityId],
      references: [communitySchema.id],
    }),
    user: one(usersSchema, {
      fields: [usersToCommunitiesSchema.userId],
      references: [usersSchema.id],
    }),
  }),
);

// TAGS
export const tagsSchema = sqliteTable("tags", {
  id: text("id").unique().notNull(),
  name: text("name").notNull().unique(),
  description: text("description", { length: 1024 }),
});
export const selectTagsSchema = createSelectSchema(tagsSchema);
export const insertTagsSchema = createInsertSchema(tagsSchema);
export const tagsRelations = relations(tagsSchema, ({ many }) => ({
  tagsToCommunities: many(tagsToCommunitiesSchema),
}));

// TAG—COMMUNITY
export const tagsToCommunitiesSchema = sqliteTable(
  "tags_communities",
  {
    tagId: text("tag_id")
      .notNull()
      .references(() => tagsSchema.id),
    communityId: text("community_id")
      .notNull()
      .references(() => communitySchema.id),
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
