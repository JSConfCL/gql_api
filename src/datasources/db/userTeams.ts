import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { teamsSchema, usersSchema } from "./schema";
import {
  createdAndUpdatedAtFields,
  TypescriptEnumAsDBEnumOptions,
  uuid,
} from "./shared";

export enum UserParticipationStatusEnum {
  accepted = "accepted",
  not_accepted = "not_accepted",
  waiting_resolution = "waiting_resolution",
}

export enum UserTeamRoleEnum {
  leader = "leader",
  member = "member",
}

export const userTeamsSchema = sqliteTable("user_teams", {
  id: uuid("id").primaryKey().notNull(),
  userId: uuid("user_id")
    .references(() => usersSchema.id)
    .notNull(),
  teamId: uuid("team_id")
    .references(() => teamsSchema.id)
    .notNull(),
  role: text("role", {
    enum: TypescriptEnumAsDBEnumOptions(UserTeamRoleEnum),
  })
    .default(UserTeamRoleEnum.leader)
    .notNull(),
  discipline: text("discipline"),
  userParticipationStatus: text("user_participation_status", {
    enum: TypescriptEnumAsDBEnumOptions(UserParticipationStatusEnum),
  })
    .default(UserParticipationStatusEnum.waiting_resolution)
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

export const udpateUserTeamsSchema = insertUserTeamsSchema
  .pick({
    discipline: true,
    userParticipationStatus: true,
  })
  .partial();
