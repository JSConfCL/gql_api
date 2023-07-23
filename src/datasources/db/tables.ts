import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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

// TAGS
export const tagsSchema = sqliteTable("tags", {
  id: text("id").unique().notNull(),
  name: text("name").notNull().unique(),
  description: text("description", { length: 1024 }),
  ...createdAndUpdatedAtFields,
});
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
