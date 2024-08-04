import { sql, relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { eventsSchema, sessionToSpeakersSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export const speakerSchema = pgTable("speakers", {
  id: uuid("id").primaryKey().defaultRandom().unique(),
  name: text("name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  eventId: uuid("event_id").references(() => eventsSchema.id),
  socials: text("social_links")
    .$type<string[]>()
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  ...createdAndUpdatedAtFields,
});

export const speakerRelations = relations(speakerSchema, ({ many }) => ({
  sessionToSpeakers: many(sessionToSpeakersSchema),
}));

export const selectSpeakerSchema = createSelectSchema(speakerSchema, {
  socials: z.array(z.string()),
});
export const insertSpeakerSchema = createInsertSchema(speakerSchema, {
  socials: z.array(z.string()),
});
