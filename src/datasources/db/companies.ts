import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";
import { relations } from "drizzle-orm";
import { salariesSchema, workEmailSchema } from "./schema";

// COMPANIES-TABLE
export const companiesSchema = sqliteTable("companies", {
  id: text("company_id").primaryKey().unique(),
  name: text("name", { length: 512 }),
  description: text("description", { length: 4096 }),
  domain: text("domain").notNull(),
  logo: text("logo"),
  website: text("website"),
  status: text("status", { enum: ["active", "inactive", "draft"] }).default(
    "draft",
  ),
  ...createdAndUpdatedAtFields,
});

export const companiesRelations = relations(companiesSchema, ({ many }) => ({
  salaries: many(salariesSchema),
  workEmails: many(workEmailSchema),
}));

export const selectCompaniesSchema = createSelectSchema(companiesSchema);
export const insertCompaniesSchema = createInsertSchema(companiesSchema);
