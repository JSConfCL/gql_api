import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { salariesSchema, workEmailSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

const companiesStatusEnum = ["active", "inactive", "draft"] as const;

// COMPANIES-TABLE
export const companiesSchema = sqliteTable("companies", {
  id: uuid("id").primaryKey().notNull(),
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
