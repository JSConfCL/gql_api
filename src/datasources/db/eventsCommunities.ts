import { relations } from "drizzle-orm";
import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { communitySchema, eventsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

// EVENTS—COMMUNITIES-TABLE
export const eventsToCommunitiesSchema = sqliteTable(
  "events_communities",
  {
    eventId: text("event_id").references(() => eventsSchema.id).notNull(),
    communityId: text("community_id").references(() => communitySchema.id).notNull(),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    primary_key: primaryKey(t.eventId, t.communityId),
  }),
);

export const eventsToCommunitiesRelations = relations(
  eventsToCommunitiesSchema,
  ({ one }) => ({
    community: one(communitySchema, {
      fields: [eventsToCommunitiesSchema.communityId],
      references: [communitySchema.id],
    }),
    event: one(eventsSchema, {
      fields: [eventsToCommunitiesSchema.eventId],
      references: [eventsSchema.id],
    }),
  }),
);

export const selectEventsToCommunitiesSchema = createSelectSchema(
  eventsToCommunitiesSchema,
);
export const insertEventsToCommunitiesSchema = createInsertSchema(
  eventsToCommunitiesSchema,
);
