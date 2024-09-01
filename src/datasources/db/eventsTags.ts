import { relations } from "drizzle-orm";
import { primaryKey, sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { eventsSchema, tagsSchema } from "~/datasources/db/schema";
import { createdAndUpdatedAtFields, uuid } from "~/datasources/db/shared";

// EVENTS—TAGS-TABLE
export const eventsToTagsSchema = sqliteTable(
  "events_tags",
  {
    id: uuid("id").notNull().unique(),
    eventId: uuid("event_id")
      .references(() => eventsSchema.id)
      .notNull(),
    tagId: uuid("tag_id")
      .references(() => tagsSchema.id)
      .notNull(),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey({ columns: [t.eventId, t.tagId] }),
  }),
);

export const eventsToTagsRelations = relations(
  eventsToTagsSchema,
  ({ one }) => ({
    event: one(eventsSchema, {
      fields: [eventsToTagsSchema.eventId],
      references: [eventsSchema.id],
    }),
    tag: one(tagsSchema, {
      fields: [eventsToTagsSchema.tagId],
      references: [tagsSchema.id],
    }),
  }),
);

export const selectEventsToTagsSchema = createSelectSchema(eventsToTagsSchema);

export const insertEventsToTagsSchema = createInsertSchema(eventsToTagsSchema);
