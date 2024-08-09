import { relations } from "drizzle-orm";
import { pgTable, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { pricesSchema, ticketsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

// TICKETS-TABLE
export const ticketsPricesSchema = pgTable("tickets_prices", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => ticketsSchema.id),
  priceId: uuid("price_id")
    .notNull()
    .references(() => pricesSchema.id),
  ...createdAndUpdatedAtFields,
});

export const ticketsPricesRelationsRelations = relations(
  ticketsPricesSchema,
  ({ one }) => ({
    ticket: one(ticketsSchema, {
      fields: [ticketsPricesSchema.ticketId],
      references: [ticketsSchema.id],
    }),
    price: one(pricesSchema, {
      fields: [ticketsPricesSchema.priceId],
      references: [pricesSchema.id],
    }),
  }),
);

export const selectTicketPriceSchema = createSelectSchema(ticketsPricesSchema);

export const insertTicketPriceSchema = createInsertSchema(ticketsPricesSchema);
