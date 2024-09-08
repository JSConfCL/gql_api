import { relations } from "drizzle-orm";
import {
  timestamp,
  pgTable,
  text,
  uuid,
  AnyPgColumn,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
  eventsToCommunitiesSchema,
  eventsToTagsSchema,
  imagesSchema,
  ticketsSchema,
} from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export const eventStatusEnum = ["active", "inactive"] as const;

export const eventVisibilityEnum = ["public", "private", "unlisted"] as const;

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
  // This is an optional URL, that will be used to share to social media and enable white_labeling.
  // For example:
  // For a purchase_order, will be shared to <publicShareUrl>/po/:purchase_order_public_id
  // For a user_ticket, will be shared to <publicShareUrl>/ticket/:user_ticket_public_id
  // if not, it will default to https://tickets.communityos.io
  publicShareUrl: text("public_share_url"),
  // For the tickets.communitys.io designs, we need to consider the following images, 3rd parties could use them, but they are not required.
  logoImage: uuid("logo_image").references((): AnyPgColumn => imagesSchema.id),
  previewImage: uuid("preview_image").references(
    (): AnyPgColumn => imagesSchema.id,
  ),
  bannerImage: uuid("banner_image").references(
    (): AnyPgColumn => imagesSchema.id,
  ),
  mobileBannerImage: uuid("mobile_banner_image").references(
    (): AnyPgColumn => imagesSchema.id,
  ),
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
