import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  userTicketsSchema,
  allowedCurrencySchema,
  eventsSchema,
} from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

const ticketStatusEnum = ["active", "inactive"] as const;

const ticketVisibilityEnum = ["public", "private", "unlisted"] as const;
// TICKETS-TABLE
export const ticketsSchema = pgTable("tickets", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull().unique(),
  description: text("description"),
  status: text("status", { enum: ticketStatusEnum })
    .notNull()
    .default("inactive"),
  visibility: text("visibility", {
    enum: ticketVisibilityEnum,
  })
    .notNull()
    .default("unlisted"),
  startDateTime: timestamp("start_date_time").notNull(),
  endDateTime: timestamp("end_date_time"),
  requiresApproval: boolean("requires_approval").default(false),
  price: integer("price"),
  quantity: integer("quantity"),
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
