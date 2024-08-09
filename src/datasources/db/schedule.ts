import { timestamp, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { eventsSchema } from "./schema";
import {
  createdAndUpdatedAtFields,
  TypescriptEnumAsDBEnumOptions,
} from "./shared";

export enum ScheduleStatus {
  active = "active",
  notActive = "not_active",
}

export const scheduleSchema = pgTable("schedule", {
  id: uuid("id").primaryKey().defaultRandom().unique(),
  eventId: uuid("event_id")
    .references(() => eventsSchema.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTimestamp: timestamp("start_at", {
    precision: 6,
  }).notNull(),
  endTimestamp: timestamp("end_at", {
    precision: 6,
  }).notNull(),
  status: text("status", {
    enum: TypescriptEnumAsDBEnumOptions(ScheduleStatus),
  }),
  ...createdAndUpdatedAtFields,
});

export const selectScheduleSchema = createSelectSchema(scheduleSchema);

export const insertScheduleSchema = createInsertSchema(scheduleSchema);
