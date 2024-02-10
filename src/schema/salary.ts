import { eq } from "drizzle-orm";
import { builder } from "~/builder";
import {
  salariesSchema,
  insertSalariesSchema,
  selectSalariesSchema,
  selectCompaniesSchema,
  selectWorkRoleSchema,
  selectWorkSenioritySchema,
  updateSalariesSchema,
  confirmationTokenSchema,
} from "~/datasources/db/schema";
import {
  CompanyRef,
  SalaryRef,
  WorkSeniorityRef,
  WorkRoleRef,
} from "~/schema/shared/refs";
import { GenderEnum } from "./shared/enums";
import { z } from "zod";

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
    workRole: t.field({
      type: WorkRoleRef,
      nullable: false,
      resolve: async (root, args, { DB }) => {
        const salaryWithRole = await DB.query.salariesSchema.findFirst({
          where: (c, { eq }) => eq(c.id, root.id),
          with: {
            workSeniorityAndRole: {
              with: {
                role: true,
              },
            },
          },
        });
        if (!salaryWithRole || !salaryWithRole?.workSeniorityAndRole?.role) {
          throw new Error("Role not found");
        }
        return selectWorkRoleSchema.parse(
          salaryWithRole.workSeniorityAndRole?.role,
        );
      },
    }),
    workSeniority: t.field({
      type: WorkSeniorityRef,
      nullable: false,
      resolve: async (root, args, { DB }) => {
        const salaryWithRole = await DB.query.salariesSchema.findFirst({
          where: (c, { eq }) => eq(c.id, root.id),
          with: {
            workSeniorityAndRole: {
              with: {
                seniority: true,
              },
            },
          },
        });
        if (
          !salaryWithRole ||
          !salaryWithRole?.workSeniorityAndRole?.seniority
        ) {
          throw new Error("Role not found");
        }
        return selectWorkSenioritySchema.parse(
          salaryWithRole.workSeniorityAndRole?.seniority,
        );
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
    currencyCode: t.exposeString("currencyCode", { nullable: false }),
    countryCode: t.exposeString("countryCode", { nullable: false }),
  }),
});

const CreateSalaryInput = builder.inputType("CreateSalaryInput", {
  fields: (t) => ({
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
    currencyCode: t.field({
      type: "String",
      required: true,
    }),
    countryCode: t.field({
      type: "String",
      required: true,
    }),
    workSeniorityId: t.field({
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
    salaryId: t.field({
      type: "String",
      required: true,
    }),
    confirmationToken: t.field({
      type: "String",
      required: true,
    }),
    amount: t.field({
      type: "Int",
      required: false,
    }),
    currencyCode: t.field({
      type: "String",
      required: false,
    }),
    countryCode: t.field({
      type: "String",
      required: false,
    }),
    workSeniorityId: t.field({
      type: "String",
      required: false,
    }),
    workRoleId: t.field({
      type: "String",
      required: false,
    }),
    yearsOfExperience: t.field({
      type: "Int",
      required: false,
    }),
    gender: t.field({
      type: GenderEnum,
      required: false,
    }),
    genderOtherText: t.field({
      type: "String",
      required: false,
    }),
    typeOfEmployment: t.field({
      type: TypeOfEmployment,
      required: false,
    }),
    workMetodology: t.field({
      type: WorkMetodology,
      required: false,
    }),
  }),
});

builder.queryFields((t) => ({
  salaries: t.field({
    description: "Get a list of salaries associated to the user",
    type: [SalaryRef],
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, _, { DB, USER }) => {
      if (!USER) {
        throw new Error("No user present");
      }
      const salaries = await DB.query.salariesSchema.findMany({
        where: (salary, { eq }) => eq(salary.userId, USER.id),
      });
      return salaries.map((salary) => selectSalariesSchema.parse(salary));
    },
  }),
}));

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
        currencyCode,
        workRoleId,
        workSeniorityId,
        countryCode,
        typeOfEmployment,
        workMetodology,
        yearsOfExperience,
        gender,
        genderOtherText,
      } = input;

      const userId = USER.id;

      const foundConfirmationToken =
        await DB.query.confirmationTokenSchema.findFirst({
          where: (c, { eq, and, inArray }) =>
            and(
              eq(c.token, confirmationToken),
              eq(c.userId, userId),
              inArray(c.status, ["pending"]),
              inArray(c.source, ["onboarding", "salary_submission"]),
            ),
        });
      if (!foundConfirmationToken) {
        throw new Error("Token not found");
      }
      if (new Date(foundConfirmationToken.validUntil) <= new Date()) {
        throw new Error("Token expired");
      }
      const workSeniorityAndRole =
        await DB.query.workSeniorityAndRoleSchema.findFirst({
          where: (c, { eq, and }) =>
            and(
              eq(c.workRoleId, workRoleId),
              eq(c.workSeniorityId, workSeniorityId),
            ),
        });

      if (!workSeniorityAndRole) {
        throw new Error("Invalid work seniority and role combination");
      }
      // check if company exists.
      const company = await DB.query.companiesSchema.findFirst({
        where: (c, { eq }) => eq(c.id, companyId),
      });
      if (!company) {
        throw new Error("Company not found");
      }
      // check if user has a work email associated to said company
      const userWorkEmail = await DB.query.workEmailSchema.findFirst({
        where: (c, { eq, and }) =>
          and(eq(c.userId, userId), eq(c.companyId, companyId)),
      });
      if (!userWorkEmail) {
        throw new Error("User does not have an email associated to company");
      }

      if (foundConfirmationToken.source === "onboarding") {
        // Do onboarding checks:
        // check if user has 0 salaries
        const userSalaries = await DB.query.salariesSchema.findMany({
          where: (c, { eq }) => eq(c.userId, userId),
        });
        if (userSalaries.length > 0) {
          // kill token
          await DB.update(confirmationTokenSchema)
            .set({
              status: "rejected",
            })
            .where(eq(confirmationTokenSchema.id, foundConfirmationToken.id));
          throw new Error("User already has a salary");
        }
      }

      const insertSalary = insertSalariesSchema.parse({
        companyId,
        amount,
        currencyCode,
        workSeniorityAndRoleId: workSeniorityAndRole.id,
        countryCode,
        typeOfEmployment,
        userId,
        workMetodology,
        yearsOfExperience,
        gender,
        genderOtherText,
      });
      const salary = (
        await DB.insert(salariesSchema).values(insertSalary).returning()
      )?.[0];

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
        type: UpdateSalaryInput,
        required: true,
      }),
    },
    resolve: async (parent, { input }, { DB, USER }) => {
      if (!USER) {
        throw new Error("User is required");
      }

      const {
        salaryId,
        confirmationToken,
        amount,
        currencyCode,
        workRoleId,
        workSeniorityId,
        countryCode,
        typeOfEmployment,
        workMetodology,
        yearsOfExperience,
        gender,
        genderOtherText,
      } = input;

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
        throw new Error("Token not found");
      }
      if (
        new Date(foundConfirmationToken.validUntil) <= new Date() ||
        foundConfirmationToken.userId !== USER.id
      ) {
        throw new Error("Token expired");
      }
      const foundSalary = await DB.query.salariesSchema.findFirst({
        where: (c, { eq }) => eq(c.id, salaryId),
      });

      if (!foundSalary) {
        throw new Error("Salary not found");
      }

      if (
        (workRoleId && !workSeniorityId) ||
        (!workRoleId && workSeniorityId)
      ) {
        throw new Error("Invalid work seniority and role combination");
      }

      const ob: Partial<z.infer<typeof updateSalariesSchema>> = {
        gender,
        genderOtherText,
      };

      if (workRoleId && workSeniorityId) {
        const workSeniorityAndRole =
          await DB.query.workSeniorityAndRoleSchema.findFirst({
            where: (c, { eq, and }) =>
              and(
                eq(c.workRoleId, workRoleId),
                eq(c.workSeniorityId, workSeniorityId),
              ),
          });
        if (!workSeniorityAndRole) {
          throw new Error("Invalid work seniority and role combination");
        }
        ob.workSeniorityAndRoleId = workSeniorityAndRole.id;
      }

      if (amount) {
        ob.amount = amount;
      }
      if (currencyCode) {
        ob.currencyCode = currencyCode;
      }
      if (countryCode) {
        ob.countryCode = countryCode;
      }
      if (typeOfEmployment) {
        ob.typeOfEmployment = typeOfEmployment as
          | "fullTime"
          | "partTime"
          | "freelance";
      }
      if (workMetodology) {
        ob.workMetodology = workMetodology as "remote" | "office" | "hybrid";
      }
      if (yearsOfExperience) {
        ob.yearsOfExperience = yearsOfExperience;
      }

      const updateSalary = updateSalariesSchema.parse(ob);
      const salary = (
        await DB.update(salariesSchema)
          .set(updateSalary)
          .where(eq(salariesSchema.id, salaryId))
          .returning()
      )?.[0];

      return selectSalariesSchema.parse(salary);
    },
  }),
}));
