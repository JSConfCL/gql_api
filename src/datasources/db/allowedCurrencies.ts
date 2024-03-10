import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { createdAndUpdatedAtFields } from "./shared";
// ALLOWED_CURRENCIES-TABLE

const validPaymentMethodsEnum = [
  "stripe",
  "paypal",
  "mercado_pago",
  "bank_transfer",
] as const;

export const allowedCurrencySchema = pgTable("allowed_currencies", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  currency: text("currency").notNull().unique(),
  validPaymentMethods: text("payment_methods", {
    enum: validPaymentMethodsEnum,
  }),
  ...createdAndUpdatedAtFields,
});

export const selectAllowedCurrencySchema = createSelectSchema(
  allowedCurrencySchema,
);
export const insertAllowedCurrencySchema = createInsertSchema(
  allowedCurrencySchema,
);
