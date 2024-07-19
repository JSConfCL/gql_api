import { relations } from "drizzle-orm";
import {} from "drizzle-orm/mysql-core";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { teamsSchema, usersSchema } from "~/datasources/db/schema";

import { createdAndUpdatedAtFields } from "./shared";

export enum TeamStatusEnum {
  accepted = "accepted",
  not_accepted = "not_accepted",
  waiting_resolution = "waiting_resolution",
}

// TODO: Make this a generic type
type TeamStatusAsTuple = [(typeof TeamStatusEnum)[keyof typeof TeamStatusEnum]];

export const userTeamsSchema = pgTable("user_teams", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .references(() => usersSchema.id)
    .notNull(),
  teamId: uuid("team_id")
    .references(() => teamsSchema.id)
    .notNull(),
  role: text("role"),
  status: text("status", {
    enum: Object.values(TeamStatusEnum) as TeamStatusAsTuple,
  })
    .default(TeamStatusEnum.waiting_resolution)
    .notNull(),
  ...createdAndUpdatedAtFields,
});

export const userTeamsRelations = relations(userTeamsSchema, ({ one }) => ({
  user: one(usersSchema, {
    fields: [userTeamsSchema.userId],
    references: [usersSchema.id],
  }),
  team: one(teamsSchema, {
    fields: [userTeamsSchema.teamId],
    references: [teamsSchema.id],
  }),
}));

export const selectUserTeamsSchema = createSelectSchema(userTeamsSchema);
export const insertUserTeamsSchema = createInsertSchema(userTeamsSchema);
