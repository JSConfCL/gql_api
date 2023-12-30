import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";
import { relations } from "drizzle-orm";
import { salariesSchema, workEmailSchema } from "./schema";

const companiesStatusEnum = ["active", "inactive", "draft"] as const;
// COMPANIES-TABLE
export const companiesSchema = pgTable("companies", {
  id: text("company_id").primaryKey().unique(),
  name: text("name"),
  description: text("description"),
  domain: text("domain").notNull(),
  logo: text("logo"),
  website: text("website"),
  status: text("status", { enum: companiesStatusEnum }).default("draft"),
  ...createdAndUpdatedAtFields,
});

export const companiesRelations = relations(companiesSchema, ({ many }) => ({
  salaries: many(salariesSchema),
  workEmails: many(workEmailSchema),
}));

export const selectCompaniesSchema = createSelectSchema(companiesSchema);
export const insertCompaniesSchema = createInsertSchema(companiesSchema);
