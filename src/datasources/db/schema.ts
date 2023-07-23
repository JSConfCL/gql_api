import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const createdAndUpdatedAtFields = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`current_timestamp`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
};

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
    ...createdAndUpdatedAtFields,
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
    ...createdAndUpdatedAtFields,
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
  eventsToCommunities: many(eventsToCommunitiesSchema),
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
    ...createdAndUpdatedAtFields,
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
  ...createdAndUpdatedAtFields,
});
export const selectTagsSchema = createSelectSchema(tagsSchema);
export const insertTagsSchema = createInsertSchema(tagsSchema);
export const tagsRelations = relations(tagsSchema, ({ many }) => ({
  tagsToCommunities: many(tagsToCommunitiesSchema),
  tagsToEvents: many(eventsToTagsSchema),
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

// EVENTS
export const eventsSchema = sqliteTable(
  "events",
  {
    id: text("id").unique().notNull(),
    name: text("name", { length: 1024 }).notNull().unique(),
    description: text("description", { length: 4096 }),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("inactive"),
    visibility: text("visibility", {
      enum: ["public", "private", "unlisted"],
    })
      .notNull()
      .default("unlisted"),
    startDateTime: integer("start_date_time", {
      mode: "timestamp_ms",
    }).notNull(),
    endDateTime: integer("end_date_time", { mode: "timestamp_ms" }),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey(t.id),
  }),
);

export const selectEventsSchema = createSelectSchema(eventsSchema);
export const insertEventsSchema = createInsertSchema(eventsSchema);
export const eventsRelations = relations(eventsSchema, ({ many }) => ({
  eventsToCommunities: many(eventsToCommunitiesSchema),
  eventsToTags: many(eventsToTagsSchema),
}));

// EVENT—COMMUNITY
export const eventsToCommunitiesSchema = sqliteTable(
  "events_communities",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => eventsSchema.id),
    communityId: text("community_id")
      .notNull()
      .references(() => communitySchema.id),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey(t.eventId, t.communityId),
  }),
);

export const eventsToCommunitiesRelations = relations(
  eventsToCommunitiesSchema,
  ({ one }) => ({
    community: one(communitySchema, {
      fields: [eventsToCommunitiesSchema.communityId],
      references: [communitySchema.id],
    }),
    event: one(eventsSchema, {
      fields: [eventsToCommunitiesSchema.eventId],
      references: [eventsSchema.id],
    }),
  }),
);

// EVENT—TAG
export const eventsToTagsSchema = sqliteTable(
  "events_tags",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => eventsSchema.id),
    tagId: text("tag_id")
      .notNull()
      .references(() => tagsSchema.id),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey(t.eventId, t.tagId),
  }),
);
export const selectEventsToTagsSchema = createSelectSchema(eventsToTagsSchema);
export const insertEventsToTagsSchema = createInsertSchema(eventsToTagsSchema);

export const eventsToTagsRelations = relations(
  eventsToTagsSchema,
  ({ one }) => ({
    event: one(eventsSchema, {
      fields: [eventsToTagsSchema.eventId],
      references: [eventsSchema.id],
    }),
    tag: one(tagsSchema, {
      fields: [eventsToTagsSchema.tagId],
      references: [tagsSchema.id],
    }),
  }),
);

// EVENT—USER
export const eventsToUsersSchema = sqliteTable(
  "events_users",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => eventsSchema.id),
    userId: text("user_id")
      .notNull()
      .references(() => usersSchema.id),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey(t.eventId, t.userId),
  }),
);

export const eventsToUsersRelations = relations(
  eventsToUsersSchema,
  ({ one }) => ({
    event: one(eventsSchema, {
      fields: [eventsToUsersSchema.eventId],
      references: [eventsSchema.id],
    }),
    user: one(usersSchema, {
      fields: [eventsToUsersSchema.userId],
      references: [usersSchema.id],
    }),
  }),
);

// EVENT—USER—ROLES
export const eventsToUsersRolesSchema = sqliteTable(
  "events_users_roles",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => eventsSchema.id),
    userId: text("user_id")
      .notNull()
      .references(() => usersSchema.id),
    role: text("role", { enum: ["admin", "member"] })
      .default("member")
      .notNull(),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey(t.eventId, t.userId),
  }),
);

export const eventsToUsersRolesRelations = relations(
  eventsToUsersRolesSchema,
  ({ one }) => ({
    event: one(eventsSchema, {
      fields: [eventsToUsersRolesSchema.eventId],
      references: [eventsSchema.id],
    }),
    user: one(usersSchema, {
      fields: [eventsToUsersRolesSchema.userId],
      references: [usersSchema.id],
    }),
  }),
);
