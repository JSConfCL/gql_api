import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, uuid, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { allowedCurrencySchema, ticketsSchema, usersSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

const purchaseOrderPaymentPlatforms = ["mercadopago", "stripe"] as const;

export const puchaseOrderPaymentStatusEnum = [
  "paid",
  "unpaid",
  "not_required",
] as const;

// PURCHASE_OURDERS TABLE
export const purchaseOrdersSchema = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .references(() => usersSchema.id)
    .notNull(),
  description: text("description"),
  paymentPlatform: text("payment_platform", {
    enum: purchaseOrderPaymentPlatforms,
  }),
  totalPrice: numeric("total_price"),
  currencyId: uuid("currency_id").references(() => allowedCurrencySchema.id),
  paymentPlatformReferenceID: text("payment_platform_reference_id"),
  paymentPlatformStatus: text("payment_platform_status"),
  paymentPlatformMetadata: jsonb("payment_platform_metadata"),
  purchaseOrderPaymentStatus: text("purchase_order_payment_status", {
    enum: puchaseOrderPaymentStatusEnum,
  })
    .default("unpaid")
    .notNull(),
  ...createdAndUpdatedAtFields,
});

export const purchaseOrdersRelations = relations(
  purchaseOrdersSchema,
  ({ one, many }) => ({
    userTickets: many(ticketsSchema),
    user: one(usersSchema, {
      fields: [purchaseOrdersSchema.userId],
      references: [usersSchema.id],
    }),
  }),
);

export const selectPurchaseOrdersSchema =
  createSelectSchema(purchaseOrdersSchema);
export const insertPurchaseOrdersSchema =
  createInsertSchema(purchaseOrdersSchema);
