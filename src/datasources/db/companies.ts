import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";

// COMPANIES-TABLE
export const companiesSchema = sqliteTable("companies", {
  id: text("company_id").primaryKey().unique(),
  name: text("name"),
  description: text("description"),
  domain: text("domain").notNull(),
  logo: text("logo"),
  website: text("website"),
  ...createdAndUpdatedAtFields,
});

export const selectCompaniesSchema = createSelectSchema(companiesSchema);
export const insertCompaniesSchema = createInsertSchema(companiesSchema);
