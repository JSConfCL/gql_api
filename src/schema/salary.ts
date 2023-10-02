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
  values: ["fullTime", "partTime", "freelance"],
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

const CreateSalaryInput = builder.inputType("CreateSalaryInput", {
  fields: (t) => ({
    userId: t.field({
      type: "String",
      required: true,
    }),
    confirmationToken: t.field({
      type: "String",
      required: true,
    }),
    amount: t.field({
      type: "Int",
      required: true,
    }),
    companyId: t.field({
      type: "String",
      required: true,
    }),
    currencyId: t.field({
      type: "String",
      required: true,
    }),
    countryCode: t.field({
      type: "String",
      required: true,
    }),
    workRoleId: t.field({
      type: "String",
      required: true,
    }),
    yearsOfExperience: t.field({
      type: "Int",
      required: true,
    }),
    gender: t.field({
      type: GenderEnum,
      required: true,
    }),
    genderOtherText: t.field({
      type: "String",
      required: true,
    }),
    typeOfEmployment: t.field({
      type: TypeOfEmployment,
      required: true,
    }),
    workMetodology: t.field({
      type: WorkMetodology,
      required: true,
    }),
  }),
});

const UpdateSalaryInput = builder.inputType("UpdateSalaryInput", {
  fields: (t) => ({
    userId: t.field({
      type: "String",
      required: true,
    }),
    confirmationToken: t.field({
      type: "String",
      required: true,
    }),
    amount: t.field({
      type: "Int",
      required: true,
    }),
    companyId: t.field({
      type: "String",
      required: true,
    }),
    currencyId: t.field({
      type: "String",
      required: true,
    }),
    countryCode: t.field({
      type: "String",
      required: true,
    }),
    workRoleId: t.field({
      type: "String",
      required: true,
    }),
    yearsOfExperience: t.field({
      type: "Int",
      required: true,
    }),
    gender: t.field({
      type: GenderEnum,
      required: true,
    }),
    genderOtherText: t.field({
      type: "String",
      required: true,
    }),
    typeOfEmployment: t.field({
      type: TypeOfEmployment,
      required: true,
    }),
    workMetodology: t.field({
      type: WorkMetodology,
      required: true,
    }),
  }),
});

builder.mutationFields((t) => ({
  createSalary: t.field({
    description: "Create a salary",
    type: SalaryRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({
        type: CreateSalaryInput,
        required: true,
      }),
    },
    resolve: async (parent, { input }, { DB, USER }) => {
      if (!USER) {
        throw new Error("User is required");
      }
      const {
        confirmationToken,
        companyId,
        amount,
        currencyId,
        workRoleId,
        countryCode,
        typeOfEmployment,
        userId,
        workMetodology,
        yearsOfExperience,
        gender,
        genderOtherText,
      } = input;

      const salaryId = v4();

      const foundConfirmationToken =
        await DB.query.confirmationTokenSchema.findFirst({
          where: (c, { eq, and, inArray }) =>
            and(
              eq(c.token, confirmationToken),
              inArray(c.status, ["pending"]),
              inArray(c.source, ["onboarding", "salary_submission"]),
            ),
        });

      if (!foundConfirmationToken) {
        throw new Error("Invalid token");
      }
      if (foundConfirmationToken.validUntil <= new Date()) {
        throw new Error("Invalid token");
      }

      const insertSalary = insertSalariesSchema.parse({
        id: salaryId,
        companyId,
        amount,
        currencyId,
        workRoleId,
        countryCode,
        typeOfEmployment,
        userId,
        workMetodology,
        yearsOfExperience,
        gender,
        genderOtherText,
      });

      const salary = await DB.insert(salariesSchema)
        .values(insertSalary)
        .returning()
        .get();
      return selectSalariesSchema.parse(salary);
    },
  }),
  updateSalary: t.field({
    description: "Create a salary",
    type: SalaryRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({
        type: CreateSalaryInput,
        required: true,
      }),
    },
    resolve: async (parent, { input }, { DB, USER }) => {
      const {
        confirmationToken,
        companyId,
        amount,
        currencyId,
        workRoleId,
        countryCode,
        typeOfEmployment,
        userId,
        workMetodology,
        yearsOfExperience,
        gender,
        genderOtherText,
      } = input;

      const salaryId = v4();

      const foundConfirmationToken =
        await DB.query.confirmationTokenSchema.findFirst({
          where: (c, { eq, and, inArray }) =>
            and(
              eq(c.token, confirmationToken),
              inArray(c.status, ["pending"]),
              inArray(c.source, ["onboarding", "salary_submission"]),
            ),
        });

      if (!foundConfirmationToken) {
        throw new Error("Invalid token");
      }
      if (foundConfirmationToken.validUntil <= new Date()) {
        throw new Error("Invalid token");
      }

      const insertSalary = insertSalariesSchema.parse({
        id: salaryId,
        companyId,
        amount,
        currencyId,
        workRoleId,
        countryCode,
        typeOfEmployment,
        userId,
        workMetodology,
        yearsOfExperience,
        gender,
        genderOtherText,
      });

      const salary = await DB.insert(salariesSchema)
        .values(insertSalary)
        .returning()
        .get();
      return selectSalariesSchema.parse(salary);
    },
  }),
}));
