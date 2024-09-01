import { relations } from "drizzle-orm";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { uuid } from "~/datasources/db/shared";

import { sessionSchema } from "./schema";
import { speakerSchema } from "./speaker";

export const sessionToSpeakersSchema = sqliteTable("session_to_speakers", {
  id: uuid("id").primaryKey().unique(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessionSchema.id),
  speakerId: uuid("speaker_id")
    .notNull()
    .references(() => speakerSchema.id),
});

export const sessionToSpeakersRelations = relations(
  sessionToSpeakersSchema,
  ({ one }) => ({
    session: one(sessionSchema, {
      fields: [sessionToSpeakersSchema.sessionId],
      references: [sessionSchema.id],
    }),
    speaker: one(speakerSchema, {
      fields: [sessionToSpeakersSchema.speakerId],
      references: [speakerSchema.id],
    }),
  }),
);

export const selectSessionToSpeakersSchema = createSelectSchema(
  sessionToSpeakersSchema,
);

export const insertSessionToSpeakersSchema = createInsertSchema(
  sessionToSpeakersSchema,
);
