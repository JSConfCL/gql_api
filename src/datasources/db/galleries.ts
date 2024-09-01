import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { imagesSchema } from "~/datasources/db/images";

import { eventsSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

// EVENTS—TAGS-TABLE
export const galleriesSchema = sqliteTable("galleries", {
  id: uuid("id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  eventId: uuid("event_id").references(() => eventsSchema.id),
  slug: text("slug").unique().notNull(),
  ...createdAndUpdatedAtFields,
});

export const galleriesRelations = relations(galleriesSchema, ({ many }) => ({
  images: many(imagesSchema),
}));

export const selectGalleriesSchema = createSelectSchema(galleriesSchema);

export const insertGalleriesSchema = createInsertSchema(galleriesSchema);
