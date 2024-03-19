import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

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
export const insertAllowedCurrencySchema = createInsertSchema(
  allowedCurrencySchema,
);
