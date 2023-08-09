import { relations } from "drizzle-orm";
import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { eventsSchema, tagsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// EVENTS—TAGS-TABLE
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
