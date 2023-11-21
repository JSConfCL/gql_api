import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";

// EVENTS—COMMUNITIES-TABLE
export const donorsSchema = sqliteTable("donors", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  operationType: text("operation_type").notNull(),
  externalReference: text("external_reference").notNull(),
  ...createdAndUpdatedAtFields,
});

export const selectDonorsSchema = createSelectSchema(donorsSchema);
export const insertDonorsSchema = createInsertSchema(donorsSchema);
