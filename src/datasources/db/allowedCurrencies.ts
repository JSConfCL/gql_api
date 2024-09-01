import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { createdAndUpdatedAtFields, uuid } from "./shared";
// ALLOWED_CURRENCIES-TABLE

export const validPaymentMethodsEnum = ["stripe", "mercado_pago"] as const;

export const allowedCurrencySchema = sqliteTable("allowed_currencies", {
  id: uuid("id").primaryKey().notNull(),
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
