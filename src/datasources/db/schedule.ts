import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { eventsSchema } from "./schema";
import {
  createdAndUpdatedAtFields,
  TypescriptEnumAsDBEnumOptions,
  uuid,
  timestamp,
} from "./shared";

export enum ScheduleStatus {
  active = "active",
  notActive = "not_active",
}

export const scheduleSchema = sqliteTable("schedule", {
  id: uuid("id").primaryKey().unique(),
  eventId: uuid("event_id")
    .references(() => eventsSchema.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTimestamp: timestamp("start_at").notNull(),
  endTimestamp: timestamp("end_at").notNull(),
  status: text("status", {
    enum: TypescriptEnumAsDBEnumOptions(ScheduleStatus),
  }),
  ...createdAndUpdatedAtFields,
});

export const selectScheduleSchema = createSelectSchema(scheduleSchema);

export const insertScheduleSchema = createInsertSchema(scheduleSchema);
