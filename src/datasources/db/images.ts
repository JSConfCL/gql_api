import { relations, sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { galleriesSchema } from "~/datasources/db/schema";

import {
  createdAndUpdatedAtFields,
  TypescriptEnumAsDBEnumOptions,
  uuid,
} from "./shared";

export enum imageHostingEnum {
  cloudflare = "cloudflare",
  sanity = "sanity",
}

// EVENTS—TAGS-TABLE
export const imagesSchema = sqliteTable(
  "images",
  {
    id: uuid("id").notNull().unique(),
    url: text("image_url").notNull(),
    hosting: text("hosting", {
      enum: TypescriptEnumAsDBEnumOptions(imageHostingEnum),
    }).notNull(),
    galleryId: uuid("gallery_id").references(() => galleriesSchema.id),
    tags: text("tags", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
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
