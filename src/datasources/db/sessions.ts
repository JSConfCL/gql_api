import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { scheduleSchema, sessionToSpeakersSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid, timestamp } from "./shared";

export const sessionSchema = sqliteTable("sessions", {
  id: uuid("id").primaryKey().unique(),
  scheduleId: uuid("schedule_id")
    .references(() => scheduleSchema.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTimestamp: timestamp("start_at").notNull(),
  endTimestamp: timestamp("end_at").notNull(),
  ...createdAndUpdatedAtFields,
});

export const sessionRelations = relations(sessionSchema, ({ one, many }) => ({
  schedule: one(scheduleSchema, {
    fields: [sessionSchema.scheduleId],
    references: [scheduleSchema.id],
  }),
  sessionToSpeakers: many(sessionToSpeakersSchema),
}));

export const selectSessionSchema = createSelectSchema(sessionSchema);

export const insertSessionSchema = createInsertSchema(sessionSchema);
