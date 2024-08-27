import { relations, sql } from "drizzle-orm";
import { index, pgTable, uuid, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { galleriesSchema } from "~/datasources/db/schema";

import {
  createdAndUpdatedAtFields,
  TypescriptEnumAsDBEnumOptions,
} from "./shared";

export enum imageHostingEnum {
  cloudflare = "cloudflare",
  sanity = "sanity",
}

// EVENTS—TAGS-TABLE
export const imagesSchema = pgTable(
  "images",
  {
    id: uuid("id").notNull().defaultRandom().unique(),
    url: text("image_url").notNull(),
    hosting: text("hosting", {
      enum: TypescriptEnumAsDBEnumOptions(imageHostingEnum),
    }).notNull(),
    galleryId: uuid("gallery_id").references(() => galleriesSchema.id),
    tags: text("tags")
      .$type<string[]>()
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    ...createdAndUpdatedAtFields,
  },
  (table) => ({
    tagsIndex: index("images_tags_index").on(table.tags),
  }),
);

export const imagesRelations = relations(imagesSchema, ({ one }) => ({
  gallery: one(galleriesSchema, {
    fields: [imagesSchema.galleryId],
    references: [galleriesSchema.id],
  }),
}));

export const selectImagesSchema = createSelectSchema(imagesSchema);

export const insertImagesSchema = createInsertSchema(imagesSchema);
