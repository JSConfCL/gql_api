import { relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
  eventsToCommunitiesSchema,
  eventsToTagsSchema,
  ticketsSchema,
} from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

export const eventStatusEnum = ["active", "inactive"] as const;

export const eventVisibilityEnum = ["public", "private", "unlisted"] as const;

// EVENTS-TABLE
export const eventsSchema = sqliteTable("events", {
  id: uuid("id").primaryKey().notNull(),
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
  startDateTime: integer("start_date_time", {
    mode: "timestamp_ms",
  }).notNull(),
  endDateTime: integer("end_date_time", {
    mode: "timestamp_ms",
  }),
  timeZone: text("timezone"),
  geoLatitude: text("geo_latitude"),
  geoLongitude: text("geo_longitude"),
  geoAddressJSON: text("geo_address_json"),
  addressDescriptiveName: text("address_descriptive_name"),
  address: text("address"),
  meetingURL: text("meeting_url"),
  sanityEventId: text("sanity_event_id"),
  bannerImageSanityRef: text("banner_image_sanity_ref"),
  logoId: text("logo_id"),
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
});
