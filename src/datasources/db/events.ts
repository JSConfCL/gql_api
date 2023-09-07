import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  eventsToCommunitiesSchema,
  eventsToTagsSchema,
  ticketsSchema,
} from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

// EVENTS-TABLE
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
  startDateTime: int("start_date_time", {
    mode: "timestamp_ms",
  }).notNull(),
  endDateTime: int("end_date_time", { mode: "timestamp_ms" }),
  timeZone: text("timezone", { length: 64 }),
  geoLatitude: text("geo_latitude"),
  geoLongitude: text("geo_longitude"),
  geoAddressJSON: text("geo_address_json"),
  meetingURL: text("meeting_url"),
  maxAttendees: int("max_attendees"),
  ...createdAndUpdatedAtFields,
});

export const eventsRelations = relations(eventsSchema, ({ many }) => ({
  eventsToCommunities: many(eventsToCommunitiesSchema),
  eventsToTags: many(eventsToTagsSchema),
  eventsToTickets: many(ticketsSchema),
}));

export const selectEventsSchema = createSelectSchema(eventsSchema);
export const insertEventsSchema = createInsertSchema(eventsSchema);
