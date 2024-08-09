import { relations } from "drizzle-orm";
import { timestamp, pgTable, text, uuid } from "drizzle-orm/pg-core";
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
  id: uuid("id").primaryKey().notNull().defaultRandom(),
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
  addressDescriptiveName: text("address_descriptive_name"),
  address: text("address"),
  meetingURL: text("meeting_url"),
  sanityEventId: text("sanity_event_id"),
  bannerImageSanityRef: text("banner_image_sanity_ref"),
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
