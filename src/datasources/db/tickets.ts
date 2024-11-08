import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import {
  couponsSchema,
  eventsSchema,
  ticketAddonsSchema,
  userTicketsSchema,
} from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { ticketsPricesSchema } from "./ticketPrice";

export const ticketStatusEnum = ["active", "inactive"] as const;

export const ticketVisibilityEnum = ["public", "private", "unlisted"] as const;

// TICKETS-TABLE
export const ticketsSchema = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),
    status: text("status", { enum: ticketStatusEnum })
      .notNull()
      .default("inactive"),
    tags: text("tags")
      .$type<string[]>()
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    externalLink: text("external_link"),
    maxTicketsPerUser: integer("max_tickets_per_user"),
    imageLink: text("image_link"),
    visibility: text("visibility", {
      enum: ticketVisibilityEnum,
    })
      .notNull()
      .default("unlisted"),
    startDateTime: timestamp("start_date_time").notNull(),
    endDateTime: timestamp("end_date_time"),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    quantity: integer("quantity"),
    isUnlimited: boolean("is_unlimited").notNull().default(false),
    isFree: boolean("is_free").notNull(),
    eventId: uuid("event_id")
      .references(() => eventsSchema.id)
      .notNull(),
    stripeProductId: text("stripe_product_id"),
    mercadoPagoProductId: text("mercado_pago_product_id"),
    couponId: uuid("coupon_id").references(() => couponsSchema.id),
    ...createdAndUpdatedAtFields,
  },
  (table) => ({
    eventIdIndex: index("tickets_event_id_index").on(table.eventId),
  }),
);

export const ticketRelations = relations(ticketsSchema, ({ one, many }) => ({
  event: one(eventsSchema, {
    fields: [ticketsSchema.eventId],
    references: [eventsSchema.id],
  }),
  userTickets: many(userTicketsSchema),
  ticketsPrices: many(ticketsPricesSchema),
  ticketAddons: many(ticketAddonsSchema),
}));

export const selectTicketSchema = createSelectSchema(ticketsSchema, {
  tags: z.array(z.string()),
});

export type SelectTicketSchema = z.infer<typeof selectTicketSchema>;

export const insertTicketSchema = createInsertSchema(ticketsSchema, {
  tags: z.array(z.string()),
});

export type InsertTicketSchema = z.infer<typeof insertTicketSchema>;

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

export type UpdateTicketSchema = z.infer<typeof updateTicketSchema>;
