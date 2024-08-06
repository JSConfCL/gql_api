import { relations } from "drizzle-orm";
import { pgTable, uuid, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { eventsSchema, userTeamsSchema } from "./schema";
import {
  createdAndUpdatedAtFields,
  TypescriptEnumAsDBEnumOptions,
} from "./shared";

export enum TeamStatusEnum {
  accepted = "accepted",
  not_accepted = "not_accepted",
  invited = "invited",
  waiting_resolution = "waiting_resolution",
}

export const teamsSchema = pgTable("teams", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  eventId: uuid("event_id")
    .references(() => eventsSchema.id)
    .notNull(),
  limit: integer("limit").notNull().default(5),
  teamStatus: text("team_status", {
    enum: TypescriptEnumAsDBEnumOptions(TeamStatusEnum),
  })
    .default(TeamStatusEnum.waiting_resolution)
    .notNull(),
  description: text("description"),
  resendAudienceId: text("resend_audience_id"),
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

export const updateTeamsSchema = insertTeamsSchema
  .pick({
    name: true,
    description: true,
    teamStatus: true,
  })
  .partial();
