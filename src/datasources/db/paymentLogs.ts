import {
  sqliteTable,
  text,
  real,
  unique,
  integer,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { createdAndUpdatedAtFields, uuid } from "./shared";

const paymentPlatforms = ["mercadopago", "stripe"] as const;

// TAG—COMMUNITY
export const paymentLogsSchema = sqliteTable(
  "payments_logs",
  {
    id: uuid("id").primaryKey(),
    externalId: text("external_id").notNull(),
    externalProductReference: text("external_product_reference"),
    platform: text("platform", {
      enum: paymentPlatforms,
    }).notNull(),
    transactionAmount: text("transaction_amount").notNull(),
    externalCreationDate: integer("external_creation_date", {
      mode: "timestamp_ms",
    }),
    currencyId: text("currency_id").notNull(),
    originalResponseBlob: text("original_response_blob", {
      mode: "json",
    }).notNull(),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    unique_platform_identifier: unique().on(t.externalId, t.platform),
  }),
);

export const selectPaymentLogsSchema = createSelectSchema(paymentLogsSchema);

export const insertPaymentLogsSchema = createInsertSchema(paymentLogsSchema);
