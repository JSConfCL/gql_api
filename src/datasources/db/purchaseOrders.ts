import { relations } from "drizzle-orm";
import {
  jsonb,
  pgTable,
  text,
  uuid,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
  allowedCurrencySchema,
  ticketsSchema,
  userTicketsSchema,
  usersSchema,
} from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
export const purchaseOrderStatusEnum = ["complete", "expired", "open"] as const;
export const purchaseOrderPaymentPlatforms = ["mercadopago", "stripe"] as const;
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
  idempotencyUUIDKey: uuid("idempotency_uuid_key")
    .notNull()
    .defaultRandom()
    .unique(),
  paymentPlatform: text("payment_platform", {
    enum: purchaseOrderPaymentPlatforms,
  }),
  totalPrice: numeric("total_price"),
  status: text("status", { enum: purchaseOrderStatusEnum })
    .notNull()
    .default("open"),
  currencyId: uuid("currency_id").references(() => allowedCurrencySchema.id),
  paymentPlatformPaymentLink: text("payment_platform_payment_link"),
  paymentPlatformExpirationDate: timestamp("payment_platform_expiration_date"),
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
    tickets: many(ticketsSchema),
    userTickets: many(userTicketsSchema),
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
