import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  int,
  blob,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const createdAndUpdatedAtFields = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`current_timestamp`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
};

// USERS
export const usersSchema = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  lastName: text("lastName"),
  bio: text("bio", { length: 1024 }).default(""),
  email: text("email"),
  emailVerified: int("emailVerified", { mode: "boolean" }),
  imageUrl: text("imageUrl"),
  username: text("username", { length: 64 }).unique().notNull(),
  twoFactorEnabled: int("twoFactorEnabled", { mode: "boolean" }),
  unsafeMetadata: blob("unsafeMetadata"),
  publicMetadata: blob("publicMetadata"),
  ...createdAndUpdatedAtFields,
});

// COMMUNITY
export const communitySchema = sqliteTable(
  "communities",
  {
    id: text("id").primaryKey().notNull(),
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

// TAGS
export const tagsSchema = sqliteTable("tags", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull().unique(),
  description: text("description", { length: 1024 }),
  ...createdAndUpdatedAtFields,
});

// EVENTS
export const eventsSchema = sqliteTable("events", {
  id: text("id").primaryKey().notNull(),
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
});

// USER—COMMUNITY—ROLES
export const usersToCommunitiesSchema = sqliteTable("users_communities", {
  userId: text("user_id").references(() => usersSchema.id),
  communityId: text("community_id").references(() => communitySchema.id),
  role: text("role", { enum: ["admin", "member"] }).default("member"),
  ...createdAndUpdatedAtFields,
});

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

// EVENT—COMMUNITY
export const eventsToCommunitiesSchema = sqliteTable(
  "events_communities",
  {
    eventId: text("event_id").references(() => eventsSchema.id),
    communityId: text("community_id").references(() => communitySchema.id),
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
    eventId: text("event_id").references(() => eventsSchema.id),
    tagId: text("tag_id").references(() => tagsSchema.id),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey(t.eventId, t.tagId),
  }),
);

// EVENT—USER
export const eventsToUsersSchema = sqliteTable("events_users", {
  eventId: text("event_id").references(() => eventsSchema.id),
  userId: text("user_id").references(() => usersSchema.id),
  ...createdAndUpdatedAtFields,
});
// EVENT—USER—ROLES
export const eventsToUsersRolesSchema = sqliteTable(
  "events_users_roles",
  {
    eventId: text("event_id").references(() => eventsSchema.id),
    userId: text("user_id").references(() => usersSchema.id),
    role: text("role", { enum: ["admin", "member"] }).default("member"),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey(t.eventId, t.userId),
  }),
);
