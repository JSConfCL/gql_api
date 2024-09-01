import { relations } from "drizzle-orm";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { pricesSchema, ticketsSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

// TICKETS-TABLE
export const ticketsPricesSchema = sqliteTable("tickets_prices", {
  id: uuid("id").primaryKey().notNull(),
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
