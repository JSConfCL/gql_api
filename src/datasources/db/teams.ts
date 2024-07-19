import { relations } from "drizzle-orm";
import {} from "drizzle-orm/mysql-core";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { eventsSchema } from "~/datasources/db/events";
import { userTeamsSchema } from "~/datasources/db/userTeams";

import { createdAndUpdatedAtFields } from "./shared";

export const teamsSchema = pgTable("teams", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  eventId: uuid("event_id")
    .references(() => eventsSchema.id)
    .notNull(),
  description: text("description"),
  ...createdAndUpdatedAtFields,
});

export const teamRelations = relations(teamsSchema, ({ many, one }) => ({
  userTeams: many(userTeamsSchema),
  event: one(eventsSchema, {
    fields: [teamsSchema.eventId],
    references: [eventsSchema.id],
  }),
}));

export type TEAM = z.infer<typeof selectTeamsSchema>;

export const selectTeamsSchema = createSelectSchema(teamsSchema);
export const insertTeamsSchema = createInsertSchema(teamsSchema);
