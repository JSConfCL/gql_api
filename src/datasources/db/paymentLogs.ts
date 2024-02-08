import {
  pgTable,
  uuid,
  text,
  jsonb,
  decimal,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createdAndUpdatedAtFields } from "./shared";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const paymentPlatforms = ["mercadopago", "stripe"] as const;

// TAG—COMMUNITY
export const paymentLogsSchema = pgTable(
  "payments_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: text("external_id").notNull(),
    externalProductReference: text("external_product_reference"),
    platform: text("platform", {
      enum: paymentPlatforms,
    }).notNull(),
    transactionAmount: decimal("transaction_amount").notNull(),
    externalCreationDate: timestamp("external_creation_date", {
      mode: "date",
      precision: 6,
      withTimezone: true,
    }),
    currencyId: text("currency_id").notNull(),
    originalResponseBlob: jsonb("original_response_blob").notNull(),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    unique_platform_identifier: unique().on(t.externalId, t.platform),
  }),
);

export const selectPaymentLogsSchema = createSelectSchema(paymentLogsSchema);
export const insertPaymentLogsSchema = createInsertSchema(paymentLogsSchema);
