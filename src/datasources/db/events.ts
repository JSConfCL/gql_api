import { relations } from "drizzle-orm";
import { timestamp, pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  eventsToCommunitiesSchema,
  eventsToTagsSchema,
  ticketsSchema,
} from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export const eventStatusEnum = ["active", "inactive"] as const;
export const eventVisibilityEnum = ["public", "private", "unlisted"] as const;

// EVENTS-TABLE
export const eventsSchema = pgTable("events", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull().unique(),
  description: text("description"),
  status: text("status", { enum: eventStatusEnum })
    .notNull()
    .default("inactive"),
  visibility: text("visibility", {
    enum: eventVisibilityEnum,
  })
    .notNull()
    .default("unlisted"),
  startDateTime: timestamp("start_date_time").notNull(),
  endDateTime: timestamp("end_date_time"),
  timeZone: text("timezone"),
  geoLatitude: text("geo_latitude"),
  geoLongitude: text("geo_longitude"),
  geoAddressJSON: text("geo_address_json"),
  meetingURL: text("meeting_url"),
  maxAttendees: integer("max_attendees"),
  ...createdAndUpdatedAtFields,
});

export const eventsRelations = relations(eventsSchema, ({ many }) => ({
  eventsToCommunities: many(eventsToCommunitiesSchema),
  eventsToTags: many(eventsToTagsSchema),
  eventsToTickets: many(ticketsSchema),
}));

export const selectEventsSchema = createSelectSchema(eventsSchema);
export const insertEventsSchema = createInsertSchema(eventsSchema);
export const updateEventsSchema = insertEventsSchema.pick({
  name: true,
  description: true,
  status: true,
  visibility: true,
  startDateTime: true,
  endDateTime: true,
  timeZone: true,
  geoLatitude: true,
  geoLongitude: true,
  geoAddressJSON: true,
  meetingURL: true,
  maxAttendees: true,
});
