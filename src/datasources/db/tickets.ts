import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  userTicketsSchema,
  allowedCurrencySchema,
  eventsSchema,
} from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

// TICKETS-TABLE
export const ticketsSchema = sqliteTable("tickets", {
  id: text("id").primaryKey().notNull(),
  name: text("name", { length: 1024 }).notNull().unique(),
  description: text("description", { length: 4096 }),
  status: text("status", { enum: ["active", "inactive"] })
    .notNull()
    .default("inactive"),
  visibility: text("visibility", {
    enum: ["public", "private", "unlisted"],
  })
    .notNull()
    .default("unlisted"),
  startDateTime: int("start_date_time", {
    mode: "timestamp_ms",
  }).notNull(),
  endDateTime: int("end_date_time", { mode: "timestamp_ms" }),
  requiresApproval: int("requires_approval", { mode: "boolean" }).default(
    false,
  ),
  price: int("price"),
  quantity: int("quantity"),
  eventId: text("event_id")
    .references(() => eventsSchema.id)
    .notNull(),
  currencyId: text("currency").references(() => allowedCurrencySchema.id),
  ...createdAndUpdatedAtFields,
});

export const ticketRelations = relations(ticketsSchema, ({ one, many }) => ({
  event: one(eventsSchema, {
    fields: [ticketsSchema.eventId],
    references: [eventsSchema.id],
  }),
  userTickets: many(userTicketsSchema),
  allowedCurrencySchema: one(allowedCurrencySchema, {
    fields: [ticketsSchema.currencyId],
    references: [allowedCurrencySchema.id],
  }),
}));

export const selectTicketSchema = createSelectSchema(ticketsSchema);
export const insertTicketSchema = createInsertSchema(ticketsSchema);
