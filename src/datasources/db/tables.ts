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
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
};

// USERS
export const usersSchema = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  lastName: text("lastName"),
  bio: text("bio", { length: 1024 }).default(""),
  email: text("email"),
  isSuperAdmin: int("isSuperAdmin", { mode: "boolean" }).default(false),
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
  timeZone: text("timezone", { length: 64 }),
  geoLatitude: text("geo_latitude"),
  geoLongitude: text("geo_longitude"),
  geoAddressJSON: text("geo_address_json"),
  meetingURL: text("meeting_url"),
  maxAttendees: integer("max_attendees"),
  ...createdAndUpdatedAtFields,
});

// TICKET_TEMPLATES-TABLE
export const ticketsSchema = sqliteTable("tickets", {
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
  requiresApproval: int("requires_approval", { mode: "boolean" }).default(
    false,
  ),
  price: integer("price"),
  quantity: integer("quantity"),
  eventId: text("event_id").references(() => eventsSchema.id),
  currencyId: text("currency").references(() => allowedCurrencySchema.id),
  ...createdAndUpdatedAtFields,
});

// TICKETS-TABLE
export const userTicketsSchema = sqliteTable("userTickets", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").references(() => usersSchema.id),
  ticketTemplateId: text("ticket_template_id").references(
    () => ticketsSchema.id,
  ),
  status: text("status", { enum: ["active", "cancelled"] })
    .default("cancelled")
    .notNull(),
  paymentStatus: text("payment_status", { enum: ["paid", "unpaid"] })
    .default("unpaid")
    .notNull(),
  approvalStatus: text("approval_status", {
    enum: ["approved", "pending"],
  })
    .default("pending")
    .notNull(),
  redemptionStatus: text("redemption_status", {
    enum: ["redeemed", "pending"],
  })
    .default("pending")
    .notNull(),
  ...createdAndUpdatedAtFields,
});

// ALLOWED_CURRENCIES-TABLE
export const allowedCurrencySchema = sqliteTable("allowed_currencies", {
  id: text("id").primaryKey().notNull(),
  currency: text("currency", { length: 3 }).notNull().unique(),
  validPaymentMethods: text("payment_methods", {
    enum: ["stripe", "paypal", "mercado_pago", "bank_transfer"],
  }),
  ...createdAndUpdatedAtFields,
});

// USER—COMMUNITY—ROLES
export const usersToCommunitiesSchema = sqliteTable("users_communities", {
  userId: text("user_id").references(() => usersSchema.id),
  communityId: text("community_id").references(() => communitySchema.id),
  role: text("role", { enum: ["admin", "member", "volunteer"] }).default(
    "member",
  ),
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

// EVENT-TICKET
export const eventsToTicketsSchema = sqliteTable(
  "event_tickets",
  {
    eventId: text("event_id").references(() => eventsSchema.id),
    ticketId: text("ticket_id").references(() => ticketsSchema.id),
  },
  (t) => ({
    primary_key: primaryKey(t.eventId, t.ticketId),
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
