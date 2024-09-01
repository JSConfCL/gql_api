import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { eventsSchema, userTicketsSchema } from "./schema";
import { boolean, createdAndUpdatedAtFields, uuid } from "./shared";
import { ticketsPricesSchema } from "./ticketPrice";

export const ticketStatusEnum = ["active", "inactive"] as const;

export const ticketVisibilityEnum = ["public", "private", "unlisted"] as const;

// TICKETS-TABLE
export const ticketsSchema = sqliteTable("tickets", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name").notNull().unique(),
  description: text("description"),
  status: text("status", { enum: ticketStatusEnum })
    .notNull()
    .default("inactive"),
  tags: text("tags", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  externalLink: text("external_link"),
  maxTicketsPerUser: integer("max_tickets_per_user"),
  imageLink: text("image_link"),
  visibility: text("visibility", {
    enum: ticketVisibilityEnum,
  })
    .notNull()
    .default("unlisted"),
  startDateTime: integer("start_date_time", { mode: "timestamp_ms" }).notNull(),
  endDateTime: integer("end_date_time", { mode: "timestamp_ms" }),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  quantity: integer("quantity"),
  isUnlimited: boolean("is_unlimited").notNull().default(false),
  isFree: boolean("is_free").notNull(),
  eventId: uuid("event_id")
    .references(() => eventsSchema.id)
    .notNull(),
  stripeProductId: text("stripe_product_id"),
  mercadoPagoProductId: text("mercado_pago_product_id"),
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

export const selectTicketSchema = createSelectSchema(ticketsSchema, {
  tags: z.array(z.string()),
});

export const insertTicketSchema = createInsertSchema(ticketsSchema, {
  tags: z.array(z.string()),
});

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
    maxTicketsPerUser: true,
    imageLink: true,
    externalLink: true,
    isFree: true,
    isUnlimited: true,
    tags: true,
  })
  .partial();
