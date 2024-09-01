import { sql, relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { eventsSchema, sessionToSpeakersSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

export const speakerSchema = sqliteTable("speakers", {
  id: uuid("id").primaryKey().unique(),
  name: text("name").notNull(),
  bio: text("bio"),
  rol: text("rol"),
  avatar: text("avatar"),
  eventId: uuid("event_id").references(() => eventsSchema.id),
  company: text("company"),
  socials: text("social_links", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
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
