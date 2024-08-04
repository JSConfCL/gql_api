import { relations } from "drizzle-orm";
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { scheduleSchema, sessionToSpeakersSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export const sessionSchema = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom().unique(),
  scheduleId: uuid("schedule_id")
    .references(() => scheduleSchema.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTimestamp: timestamp("start_at", { precision: 6 }).notNull(),
  endTimestamp: timestamp("end_at", { precision: 6 }).notNull(),
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
