import { relations } from "drizzle-orm";
import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { allowedCurrencySchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { ticketsPricesSchema } from "./ticketPrice";

// TICKETS-TABLE
export const pricesSchema = pgTable("prices", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
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

export type SelectPriceSchema = z.infer<typeof selectPriceSchema>;

export const insertPriceSchema = createInsertSchema(pricesSchema);

export type InsertPriceSchema = z.infer<typeof insertPriceSchema>;
