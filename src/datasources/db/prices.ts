import { relations } from "drizzle-orm";
import { integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { allowedCurrencySchema } from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";
import { ticketsPricesSchema } from "./ticketPrice";

// TICKETS-TABLE
export const pricesSchema = sqliteTable("prices", {
  id: uuid("id").primaryKey().notNull(),
  price_in_cents: integer("price").notNull(),
  currencyId: uuid("currency_id").references(() => allowedCurrencySchema.id),
  ...createdAndUpdatedAtFields,
});

export const pricesRelations = relations(pricesSchema, ({ many, one }) => ({
  ticketsPrices: many(ticketsPricesSchema),
  currency: one(allowedCurrencySchema, {
    fields: [pricesSchema.currencyId],
    references: [allowedCurrencySchema.id],
  }),
}));

export const selectPriceSchema = createSelectSchema(pricesSchema);

export const insertPriceSchema = createInsertSchema(pricesSchema);
