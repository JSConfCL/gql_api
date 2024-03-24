import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { eventsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";

const eventsToUsersRoleEnum = ["admin", "member", "collaborator"] as const;
// EVENT—USER
export const eventsToUsersSchema = pgTable("events_users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  eventId: uuid("event_id").references(() => eventsSchema.id),
  oldUserId: text("old_user_id").references(() => usersSchema.oldId),
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
      fields: [eventsToUsersSchema.oldUserId],
      references: [usersSchema.oldId],
    }),
  }),
);

export const selectEventsToUsersSchema =
  createSelectSchema(eventsToUsersSchema);
export const insertEventsToUsersSchema =
  createInsertSchema(eventsToUsersSchema);
