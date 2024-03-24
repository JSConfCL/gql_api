import { relations } from "drizzle-orm";
import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { companiesSchema } from "./companies";
import { createdAndUpdatedAtFields, genderOptions } from "./shared";
import { usersSchema } from "./users";
import { workEmailSchema } from "./workEmail";
import { workSeniorityAndRoleSchema } from "./workSeniorityAndRole";

const typeOfEmploymentEnum = ["fullTime", "partTime", "freelance"] as const;
const workMetodologyEnum = ["remote", "office", "hybrid"] as const;

// SALARIES-TABLE
export const salariesSchema = pgTable("salaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  oldUserId: text("old_user_id")
    .references(() => usersSchema.oldId)
    .notNull(),
  amount: integer("amount").notNull(),
  companyId: uuid("company_id").references(() => companiesSchema.id),
  currencyCode: text("currency_code").notNull(),
  workSeniorityAndRoleId: uuid("work_seniority_and_role_id").references(
    () => workSeniorityAndRoleSchema.id,
  ),
  workEmailId: uuid("work_email_id").references(() => workEmailSchema.id),
  yearsOfExperience: integer("years_of_experience").notNull(),
  gender: text("gender", {
    enum: genderOptions,
  }),
  genderOtherText: text("gender_other_text"),
  countryCode: text("country_code").notNull(),
  typeOfEmployment: text("type_of_employment", {
    enum: typeOfEmploymentEnum,
  }).notNull(),
  workMetodology: text("work_metodology", {
    enum: workMetodologyEnum,
  }).notNull(),
  ...createdAndUpdatedAtFields,
});

export const salairesRelations = relations(salariesSchema, ({ one }) => ({
  company: one(companiesSchema, {
    fields: [salariesSchema.companyId],
    references: [companiesSchema.id],
  }),
  workSeniorityAndRole: one(workSeniorityAndRoleSchema, {
    fields: [salariesSchema.workSeniorityAndRoleId],
    references: [workSeniorityAndRoleSchema.id],
  }),
  workEmail: one(workEmailSchema, {
    fields: [salariesSchema.workEmailId],
    references: [workEmailSchema.id],
  }),
  user: one(usersSchema, {
    fields: [salariesSchema.oldUserId],
    references: [usersSchema.oldId],
  }),
}));

export const selectSalariesSchema = createSelectSchema(salariesSchema);
export const insertSalariesSchema = createInsertSchema(salariesSchema);
