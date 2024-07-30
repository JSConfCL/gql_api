import { builder } from "~/builder";
import {
  selectCompaniesSchema,
  selectWorkRoleSchema,
  selectWorkSenioritySchema,
} from "~/datasources/db/schema";
import { GenderEnum } from "~/schema/shared/enums";
import {
  CompanyRef,
  SalaryRef,
  WorkRoleRef,
  WorkSeniorityRef,
} from "~/schema/shared/refs";

export const TypeOfEmployment = builder.enumType("TypeOfEmployment", {
  values: ["fullTime", "partTime", "freelance"],
});

export const WorkMetodology = builder.enumType("WorkMetodology", {
  values: ["remote", "office", "hybrid"],
});

builder.objectType(SalaryRef, {
  description: "Representation of a workEmail",
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
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
