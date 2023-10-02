import { SQL, eq, like } from "drizzle-orm";
import { v4 } from "uuid";
import { builder } from "~/builder";
import {
  salariesSchema,
  insertSalariesSchema,
  selectSalariesSchema,
  selectCompaniesSchema,
  selectAllowedCurrencySchema,
  selectWorkRoleSchema,
} from "~/datasources/db/schema";
import {
  AllowedCurrencyRef,
  CompanyRef,
  SalaryRef,
  WorkRoleRef,
} from "~/schema/shared/refs";
import { GenderEnum } from "./shared/enums";

const TypeOfEmployment = builder.enumType("TypeOfEmployment", {
  values: ["fullTime", "partTime", "freelance", "internship"],
});

const WorkMetodology = builder.enumType("WorkMetodology", {
  values: ["remote", "office", "hybrid"],
});

builder.objectType(SalaryRef, {
  description: "Representation of a workEmail",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    company: t.field({
      type: CompanyRef,
      nullable: false,
      resolve: async (root, args, { DB }) => {
        const salaryWithCompany = await DB.query.salariesSchema.findFirst({
          where: (c, { eq }) => eq(c.id, root.id),
          with: {
            company: true,
          },
        });
        if (!salaryWithCompany || !salaryWithCompany?.company) {
          throw new Error("Company not found");
        }
        return selectCompaniesSchema.parse(salaryWithCompany.company);
      },
    }),
    amount: t.exposeInt("amount", { nullable: false }),
    currency: t.field({
      type: AllowedCurrencyRef,
      nullable: false,
      resolve: async (root, args, { DB }) => {
        const salaryWithCurrency = await DB.query.salariesSchema.findFirst({
          where: (c, { eq }) => eq(c.id, root.id),
          with: {
            currency: true,
          },
        });
        if (!salaryWithCurrency || !salaryWithCurrency?.currency) {
          throw new Error("Currency not found");
        }
        return selectAllowedCurrencySchema.parse(salaryWithCurrency.currency);
      },
    }),
    workRole: t.field({
      type: WorkRoleRef,
      nullable: false,
      resolve: async (root, args, { DB }) => {
        const salaryWithRole = await DB.query.salariesSchema.findFirst({
          where: (c, { eq }) => eq(c.id, root.id),
          with: {
            workRole: true,
          },
        });
        if (!salaryWithRole || !salaryWithRole?.workRole) {
          throw new Error("Role not found");
        }
        return selectWorkRoleSchema.parse(salaryWithRole.workRole);
      },
    }),
    typeOfEmployment: t.field({
      type: TypeOfEmployment,
      nullable: false,
      resolve: (root) => root.typeOfEmployment,
    }),
    workMetodology: t.field({
      type: WorkMetodology,
      nullable: false,
      resolve: (root) => root.workMetodology,
    }),
    yearsOfExperience: t.exposeInt("yearsOfExperience", { nullable: false }),
    gender: t.field({
      type: GenderEnum,
      nullable: true,
      resolve: (root) => root.gender,
    }),
    genderOtherText: t.exposeString("genderOtherText", { nullable: true }),
    countryCode: t.exposeString("countryCode", { nullable: false }),
  }),
});
