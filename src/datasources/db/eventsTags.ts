import { relations } from "drizzle-orm";
import { primaryKey, pgTable, uuid } from "drizzle-orm/pg-core";
import { eventsSchema, tagsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// EVENTS—TAGS-TABLE
export const eventsToTagsSchema = pgTable(
  "events_tags",
  {
    id: uuid("id").notNull().defaultRandom().unique(),
    eventId: uuid("event_id").references(() => eventsSchema.id),
    tagId: uuid("tag_id").references(() => tagsSchema.id),
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
