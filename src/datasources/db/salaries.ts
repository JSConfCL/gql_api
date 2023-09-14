import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";
import { allowedCurrencySchema } from "./allowedCurrencies";
import { workRoleSchema } from "./workRoles";

// SALARIES-TABLE
export const salariesSchema = sqliteTable("companies", {
  id: text("company_id").primaryKey().unique(),
  userId: text("user_id")
    .references(() => usersSchema.id)
    .notNull(),
  amount: int("amount").notNull(),
  currencyId: text("currency").references(() => allowedCurrencySchema.id),
  workRoleId: text("work_role_id").references(() => workRoleSchema.id),
  yearsOfExperience: int("years_of_experience").notNull(),
  countryCode: text("country_code").notNull(),
  typeOfEmployment: text("country_code", {
    enum: ["full_time", "part_time", "unpaid_internship", "paid_internship"],
  }).notNull(),
  workMetodology: text("country_code", {
    enum: ["remote", "office", "hybrid"],
  }).notNull(),
  ...createdAndUpdatedAtFields,
});

export const selectSalariesSchema = createSelectSchema(salariesSchema);
export const insertSalariesSchema = createInsertSchema(salariesSchema);
