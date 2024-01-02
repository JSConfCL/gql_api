import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";
import { workRoleSchema } from "./workRole";
import { relations } from "drizzle-orm";
import { companiesSchema } from "./companies";
import { genderOptions } from "./shared";
import { workEmailSchema } from "./workEmail";
import { workSeniorityAndRoleSchema } from "./workSeniorityAndRole";

const typeOfEmploymentEnum = ["fullTime", "partTime", "freelance"] as const;
const workMetodologyEnum = ["remote", "office", "hybrid"] as const;

// SALARIES-TABLE
export const salariesSchema = pgTable("salaries", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  userId: text("user_id")
    .references(() => usersSchema.id)
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
    fields: [salariesSchema.userId],
    references: [usersSchema.id],
  }),
}));

export const selectSalariesSchema = createSelectSchema(salariesSchema);
export const insertSalariesSchema = createInsertSchema(salariesSchema);
