import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { createdAndUpdatedAtFields } from "./shared";
// ALLOWED_CURRENCIES-TABLE

export const validPaymentMethodsEnum = ["stripe", "mercado_pago"] as const;

export const allowedCurrencySchema = pgTable("allowed_currencies", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  currency: text("currency").notNull().unique(),
  validPaymentMethods: text("payment_methods", {
    enum: validPaymentMethodsEnum,
  }).notNull(),
  ...createdAndUpdatedAtFields,
});

export const selectAllowedCurrencySchema = createSelectSchema(
  allowedCurrencySchema,
);

export type SelectAllowedCurrencySchema = z.infer<
  typeof selectAllowedCurrencySchema
>;

export const insertAllowedCurrencySchema = createInsertSchema(
  allowedCurrencySchema,
);

export type InsertAllowedCurrencySchema = z.infer<
  typeof insertAllowedCurrencySchema
>;
