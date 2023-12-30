import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";
import { workRoleSchema } from "./workRoles";
import { relations } from "drizzle-orm";
import { companiesSchema } from "./companies";
import { genderOptions } from "./shared";
import { workEmailSchema } from "./workEmail";

// SALARIES-TABLE
export const salariesSchema = sqliteTable("salaries", {
  id: text("id").primaryKey().unique(),
  userId: text("user_id")
    .references(() => usersSchema.id)
    .notNull(),
  amount: int("amount").notNull(),
  companyId: text("company_id").references(() => companiesSchema.id),
  currencyCode: text("currency_code").notNull(),
  workRoleId: text("work_role_id").references(() => workRoleSchema.id),
  workEmailId: text("work_email_id").references(() => workEmailSchema.id),
  yearsOfExperience: int("years_of_experience").notNull(),
  gender: text("gender", {
    enum: genderOptions,
  }),
  genderOtherText: text("gender_other_text"),
  countryCode: text("country_code").notNull(),
  typeOfEmployment: text("type_of_employment", {
    enum: ["fullTime", "partTime", "freelance"],
  }).notNull(),
  workMetodology: text("work_metodology", {
    enum: ["remote", "office", "hybrid"],
  }).notNull(),
  ...createdAndUpdatedAtFields,
});

export const salairesRelations = relations(salariesSchema, ({ one }) => ({
  company: one(companiesSchema, {
    fields: [salariesSchema.companyId],
    references: [companiesSchema.id],
  }),
  workRole: one(workRoleSchema, {
    fields: [salariesSchema.workRoleId],
    references: [workRoleSchema.id],
  }),
  workEmail: one(workEmailSchema, {
    fields: [salariesSchema.workEmailId],
    references: [workEmailSchema.id],
  }),
  user: one(usersSchema, {
    fields: [salariesSchema.userId],
    references: [usersSchema.id],
  }),
}));

export const selectSalariesSchema = createSelectSchema(salariesSchema);
export const insertSalariesSchema = createInsertSchema(salariesSchema);
