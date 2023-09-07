import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { eventsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// EVENT—USER
export const eventsToUsersSchema = sqliteTable("events_users", {
  eventId: text("event_id").references(() => eventsSchema.id),
  userId: text("user_id").references(() => usersSchema.id),
  role: text("role", { enum: ["admin", "member", "collaborator"] }).default(
    "member",
  ),
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
