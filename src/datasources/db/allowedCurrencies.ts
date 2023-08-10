import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";
// ALLOWED_CURRENCIES-TABLE
export const allowedCurrencySchema = sqliteTable("allowed_currencies", {
  id: text("id").primaryKey().notNull(),
  currency: text("currency", { length: 3 }).notNull().unique(),
  validPaymentMethods: text("payment_methods", {
    enum: ["stripe", "paypal", "mercado_pago", "bank_transfer"],
  }),
  ...createdAndUpdatedAtFields,
});

export const selectAllowedCurrencySchema = createSelectSchema(
  allowedCurrencySchema,
);
export const insertAllowedCurrencySchema = createInsertSchema(
  allowedCurrencySchema,
);
