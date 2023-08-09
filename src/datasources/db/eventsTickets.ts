import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { eventsSchema } from "./schema";
import { ticketsSchema } from "./tickets";

// EVENTS-TICKETS-TABLE
export const eventsToTicketsSchema = sqliteTable(
  "event_tickets",
  {
    eventId: text("event_id").references(() => eventsSchema.id),
    ticketId: text("ticket_id").references(() => ticketsSchema.id),
  },
  (t) => ({
    primary_key: primaryKey(t.eventId, t.ticketId),
  }),
);

export const selectEventsToTicketsSchema = createSelectSchema(
  eventsToTicketsSchema,
);
export const insertEventsToTicketsSchema = createInsertSchema(
  eventsToTicketsSchema,
);
