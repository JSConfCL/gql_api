import { pgTable, text } from "drizzle-orm/pg-core";
import { eventsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const eventsToUsersRoleEnum = ["admin", "member", "collaborator"] as const;
// EVENT—USER
export const eventsToUsersSchema = pgTable("events_users", {
  eventId: text("event_id").references(() => eventsSchema.id),
  userId: text("user_id").references(() => usersSchema.id),
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
