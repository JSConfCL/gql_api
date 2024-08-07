import { eq } from "drizzle-orm";

import { builder } from "~/builder";
import {
  insertSalariesSchema,
  salariesSchema,
  selectSalariesSchema,
} from "~workers/db_service/db/schema";
import { GenderEnum } from "~/schema/shared/enums";
import { SalaryRef } from "~/schema/shared/refs";

import { TypeOfEmployment, WorkMetodology } from "./types";

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
    workSeniorityAndRoleId: t.field({
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
    workSeniorityAndRoleId: t.field({
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
        workSeniorityAndRoleId,
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
        throw new Error("Invalid token");
      }

      if (new Date(foundConfirmationToken.validUntil) <= new Date()) {
        throw new Error("Invalid token");
      }

      const insertSalary = insertSalariesSchema.parse({
        companyId,
        amount,
        currencyCode,
        workSeniorityAndRoleId,
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

      const userId = USER.id;

      const {
        salaryId,
        confirmationToken,
        amount,
        currencyCode,
        workSeniorityAndRoleId,
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
        throw new Error("Invalid token");
      }

      if (
        new Date(foundConfirmationToken.validUntil) <= new Date() ||
        foundConfirmationToken.userId !== USER.id
      ) {
        throw new Error("Invalid token");
      }

      const foundSalary = await DB.query.salariesSchema.findFirst({
        where: (c, { eq }) => eq(c.id, salaryId),
      });

      if (!foundSalary) {
        throw new Error("Salary not found");
      }

      const insertSalary = insertSalariesSchema.parse({
        id: salaryId,
        amount,
        currencyCode,
        workSeniorityAndRoleId,
        countryCode,
        typeOfEmployment,
        userId,
        workMetodology,
        yearsOfExperience,
        gender,
        genderOtherText,
      });

      const salary = (
        await DB.update(salariesSchema)
          .set(insertSalary)
          .where(eq(salariesSchema.id, salaryId))
          .returning()
      )?.[0];

      return selectSalariesSchema.parse(salary);
    },
  }),
}));
