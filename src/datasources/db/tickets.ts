import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { eventsSchema, userTicketsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { ticketsPricesSchema } from "./ticketPrice";

const ticketStatusEnum = ["active", "inactive"] as const;

const ticketVisibilityEnum = ["public", "private", "unlisted"] as const;
// TICKETS-TABLE
export const ticketsSchema = pgTable("tickets", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
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
  quantity: integer("quantity"),
  eventId: uuid("event_id")
    .references(() => eventsSchema.id)
    .notNull(),
  ...createdAndUpdatedAtFields,
});

export const ticketRelations = relations(ticketsSchema, ({ one, many }) => ({
  event: one(eventsSchema, {
    fields: [ticketsSchema.eventId],
    references: [eventsSchema.id],
  }),
  userTickets: many(userTicketsSchema),
  ticketsPrices: many(ticketsPricesSchema),
}));

export const selectTicketSchema = createSelectSchema(ticketsSchema);
export const insertTicketSchema = createInsertSchema(ticketsSchema);
export const updateTicketSchema = insertTicketSchema
  .pick({
    name: true,
    description: true,
    status: true,
    visibility: true,
    startDateTime: true,
    endDateTime: true,
    quantity: true,
    requiresApproval: true,
  })
  .partial();
