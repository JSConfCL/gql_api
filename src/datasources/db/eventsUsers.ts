import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { eventsSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";
import { usersSchema } from "./users";

const eventsToUsersRoleEnum = ["admin", "member", "collaborator"] as const;

// EVENT—USER
export const eventsToUsersSchema = sqliteTable("events_users", {
  id: uuid("id").primaryKey().notNull(),
  eventId: uuid("event_id").references(() => eventsSchema.id),
  userId: uuid("user_id").references(() => usersSchema.id),
  role: text("role", { enum: eventsToUsersRoleEnum }).default("member"),
  ...createdAndUpdatedAtFields,
});

export const eventsToUsersRelations = relations(
  eventsToUsersSchema,
  ({ one }) => ({
    event: one(eventsSchema, {
      fields: [eventsToUsersSchema.eventId],
      references: [eventsSchema.id],
    }),
    user: one(usersSchema, {
      fields: [eventsToUsersSchema.userId],
      references: [usersSchema.id],
    }),
  }),
);

export const selectEventsToUsersSchema =
  createSelectSchema(eventsToUsersSchema);

export const insertEventsToUsersSchema =
  createInsertSchema(eventsToUsersSchema);
