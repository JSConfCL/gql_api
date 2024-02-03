import { assert, describe, expect, it } from "vitest";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsUser,
  insertCompany,
  insertConfirmationToken,
  insertUser,
  insertWorkEmail,
  insertWorkRole,
  insertWorkSeniority,
  insertWorkSeniorityAndRole,
} from "~/tests/__fixtures";
import { getTestDB } from "~/tests/__fixtures/databaseHelper";
import {
  Gender,
  TypeOfEmployment,
  WorkMetodology,
} from "../../generated/types";
import {
  CreateSalary,
  CreateSalaryMutation,
  CreateSalaryMutationVariables,
} from "./mutations.generated";

describe("Salary creation", () => {
  describe("User has a valid token", () => {
    it("Should create a salary", async () => {
      const testDB = await getTestDB();
      const user = await insertUser();
      const company = await insertCompany({
        status: "active",
      });
      const workSeniority = await insertWorkSeniority();
      const workRole = await insertWorkRole();
      await insertWorkSeniorityAndRole({
        workRoleId: workRole.id,
        workSeniorityId: workSeniority.id,
      });

      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user.id,
        status: "pending",
        sourceId: "123",
      });
      await insertWorkEmail({
        confirmationTokenId: insertedConfirmationToken.id,
        userId: user.id,
        companyId: company.id,
      });

      const StartWorkEmailValidationResponse =
        await executeGraphqlOperationAsUser<
          CreateSalaryMutation,
          CreateSalaryMutationVariables
        >(
          {
            document: CreateSalary,
            variables: {
              input: {
                confirmationToken: insertedConfirmationToken.token,
                amount: 1000,
                companyId: company.id,
                countryCode: "US",
                currencyCode: "US",
                gender: Gender.Agender,
                typeOfEmployment: TypeOfEmployment.FullTime,
                workMetodology: WorkMetodology.Hybrid,
                workRoleId: workRole.id,
                workSeniorityId: workSeniority.id,
                genderOtherText: "",
                yearsOfExperience: 1,
              },
            },
          },
          user,
        );
      const confirmationToken =
        await testDB.query.confirmationTokenSchema.findFirst();

      if (!confirmationToken) {
        throw new Error("Confirmation token not found");
      }

      console.log(
        "StartWorkEmailValidationResponse",
        StartWorkEmailValidationResponse,
      );

      assert.equal(StartWorkEmailValidationResponse.errors, undefined);
    });
  });
  describe("Creation should fail", () => {
    it("With an annonymous user", async () => {
      const testDB = await getTestDB();
      const user = await insertUser();
      const company = await insertCompany({
        status: "active",
      });
      const workSeniority = await insertWorkSeniority();
      const workRole = await insertWorkRole();
      await insertWorkSeniorityAndRole({
        workRoleId: workRole.id,
        workSeniorityId: workSeniority.id,
      });
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user.id,
        status: "pending",
        sourceId: "123",
      });
      await insertWorkEmail({
        confirmationTokenId: insertedConfirmationToken.id,
        userId: user.id,
        companyId: company.id,
      });

      const StartWorkEmailValidationResponse = await executeGraphqlOperation<
        CreateSalaryMutation,
        CreateSalaryMutationVariables
      >({
        document: CreateSalary,
        variables: {
          input: {
            confirmationToken: insertedConfirmationToken.token,
            amount: 1000,
            companyId: company.id,
            countryCode: "US",
            currencyCode: "US",
            gender: Gender.Agender,
            typeOfEmployment: TypeOfEmployment.FullTime,
            workMetodology: WorkMetodology.Hybrid,
            workRoleId: workRole.id,
            workSeniorityId: workSeniority.id,
            genderOtherText: "",
            yearsOfExperience: 1,
          },
        },
      });
      const confirmationToken =
        await testDB.query.confirmationTokenSchema.findFirst();

      if (!confirmationToken) {
        throw new Error("Confirmation token not found");
      }

      expect(StartWorkEmailValidationResponse.errors).toBeDefined();
    });
    it("If the user using the code is not the same user that created it", async () => {
      const testDB = await getTestDB();
      const user = await insertUser();
      const user2 = await insertUser();
      const company = await insertCompany({
        status: "active",
      });
      const workSeniority = await insertWorkSeniority();
      const workRole = await insertWorkRole();
      await insertWorkSeniorityAndRole({
        workRoleId: workRole.id,
        workSeniorityId: workSeniority.id,
      });
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user2.id,
        status: "pending",
        sourceId: "123",
      });
      await insertWorkEmail({
        confirmationTokenId: insertedConfirmationToken.id,
        userId: user.id,
        companyId: company.id,
      });

      const StartWorkEmailValidationResponse =
        await executeGraphqlOperationAsUser<
          CreateSalaryMutation,
          CreateSalaryMutationVariables
        >(
          {
            document: CreateSalary,
            variables: {
              input: {
                confirmationToken: insertedConfirmationToken.token,
                amount: 1000,
                companyId: company.id,
                countryCode: "US",
                currencyCode: "US",
                gender: Gender.Agender,
                typeOfEmployment: TypeOfEmployment.FullTime,
                workMetodology: WorkMetodology.Hybrid,
                workRoleId: workRole.id,
                workSeniorityId: workSeniority.id,
                genderOtherText: "",
                yearsOfExperience: 1,
              },
            },
          },
          user,
        );
      const confirmationToken =
        await testDB.query.confirmationTokenSchema.findFirst();

      if (!confirmationToken) {
        throw new Error("Confirmation token not found");
      }

      expect(StartWorkEmailValidationResponse.errors).toBeDefined();
    });
    it("With a wrong code", async () => {
      const testDB = await getTestDB();
      const user = await insertUser();
      const user2 = await insertUser();
      const company = await insertCompany({
        status: "active",
      });
      const workSeniority = await insertWorkSeniority();
      const workRole = await insertWorkRole();
      await insertWorkSeniorityAndRole({
        workRoleId: workRole.id,
        workSeniorityId: workSeniority.id,
      });
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user2.id,
        status: "pending",
        sourceId: "123",
      });
      await insertWorkEmail({
        confirmationTokenId: insertedConfirmationToken.id,
        userId: user.id,
        companyId: company.id,
      });

      const StartWorkEmailValidationResponse =
        await executeGraphqlOperationAsUser<
          CreateSalaryMutation,
          CreateSalaryMutationVariables
        >(
          {
            document: CreateSalary,
            variables: {
              input: {
                confirmationToken: "HELLA RANDOM CODE",
                amount: 1000,
                companyId: company.id,
                countryCode: "US",
                currencyCode: "US",
                gender: Gender.Agender,
                typeOfEmployment: TypeOfEmployment.FullTime,
                workMetodology: WorkMetodology.Hybrid,
                workRoleId: workRole.id,
                workSeniorityId: workSeniority.id,
                genderOtherText: "",
                yearsOfExperience: 1,
              },
            },
          },
          user,
        );
      const confirmationToken =
        await testDB.query.confirmationTokenSchema.findFirst();

      if (!confirmationToken) {
        throw new Error("Confirmation token not found");
      }

      expect(StartWorkEmailValidationResponse.errors).toBeDefined();
    });
    it("With a previously validated code", async () => {
      const testDB = await getTestDB();
      const user = await insertUser();
      const company = await insertCompany({
        status: "active",
      });
      const workSeniority = await insertWorkSeniority();
      const workRole = await insertWorkRole();
      await insertWorkSeniorityAndRole({
        workRoleId: workRole.id,
        workSeniorityId: workSeniority.id,
      });
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user.id,
        status: "confirmed",
        sourceId: "123",
      });
      await insertWorkEmail({
        confirmationTokenId: insertedConfirmationToken.id,
        userId: user.id,
        companyId: company.id,
      });

      const StartWorkEmailValidationResponse =
        await executeGraphqlOperationAsUser<
          CreateSalaryMutation,
          CreateSalaryMutationVariables
        >(
          {
            document: CreateSalary,
            variables: {
              input: {
                confirmationToken: insertedConfirmationToken.token,
                amount: 1000,
                companyId: company.id,
                countryCode: "US",
                currencyCode: "US",
                gender: Gender.Agender,
                typeOfEmployment: TypeOfEmployment.FullTime,
                workMetodology: WorkMetodology.Hybrid,
                workRoleId: workRole.id,
                workSeniorityId: workSeniority.id,
                genderOtherText: "",
                yearsOfExperience: 1,
              },
            },
          },
          user,
        );
      const confirmationToken =
        await testDB.query.confirmationTokenSchema.findFirst();

      if (!confirmationToken) {
        throw new Error("Confirmation token not found");
      }

      expect(StartWorkEmailValidationResponse.errors).toBeDefined();
    });
    it("With a rejected code", async () => {
      const testDB = await getTestDB();
      const user = await insertUser();
      const company = await insertCompany({
        status: "active",
      });
      const workSeniority = await insertWorkSeniority();
      const workRole = await insertWorkRole();
      await insertWorkSeniorityAndRole({
        workRoleId: workRole.id,
        workSeniorityId: workSeniority.id,
      });
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user.id,
        status: "rejected",
        sourceId: "123",
      });
      await insertWorkEmail({
        confirmationTokenId: insertedConfirmationToken.id,
        userId: user.id,
        companyId: company.id,
      });

      const StartWorkEmailValidationResponse =
        await executeGraphqlOperationAsUser<
          CreateSalaryMutation,
          CreateSalaryMutationVariables
        >(
          {
            document: CreateSalary,
            variables: {
              input: {
                confirmationToken: insertedConfirmationToken.token,
                amount: 1000,
                companyId: company.id,
                countryCode: "US",
                currencyCode: "US",
                gender: Gender.Agender,
                typeOfEmployment: TypeOfEmployment.FullTime,
                workMetodology: WorkMetodology.Hybrid,
                workRoleId: workRole.id,
                workSeniorityId: workSeniority.id,
                genderOtherText: "",
                yearsOfExperience: 1,
              },
            },
          },
          user,
        );
      const confirmationToken =
        await testDB.query.confirmationTokenSchema.findFirst();

      if (!confirmationToken) {
        throw new Error("Confirmation token not found");
      }

      expect(StartWorkEmailValidationResponse.errors).toBeDefined();
    });
    it("With an expired code", async () => {
      const testDB = await getTestDB();
      const user = await insertUser();
      const company = await insertCompany({
        status: "active",
      });
      const workSeniority = await insertWorkSeniority();
      const workRole = await insertWorkRole();
      await insertWorkSeniorityAndRole({
        workRoleId: workRole.id,
        workSeniorityId: workSeniority.id,
      });
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user.id,
        status: "expired",
        sourceId: "123",
      });
      await insertWorkEmail({
        confirmationTokenId: insertedConfirmationToken.id,
        userId: user.id,
        companyId: company.id,
      });

      const StartWorkEmailValidationResponse =
        await executeGraphqlOperationAsUser<
          CreateSalaryMutation,
          CreateSalaryMutationVariables
        >(
          {
            document: CreateSalary,
            variables: {
              input: {
                confirmationToken: insertedConfirmationToken.token,
                amount: 1000,
                companyId: company.id,
                countryCode: "US",
                currencyCode: "US",
                gender: Gender.Agender,
                typeOfEmployment: TypeOfEmployment.FullTime,
                workMetodology: WorkMetodology.Hybrid,
                workRoleId: workRole.id,
                workSeniorityId: workSeniority.id,
                genderOtherText: "",
                yearsOfExperience: 1,
              },
            },
          },
          user,
        );
      const confirmationToken =
        await testDB.query.confirmationTokenSchema.findFirst();

      if (!confirmationToken) {
        throw new Error("Confirmation token not found");
      }

      expect(StartWorkEmailValidationResponse.errors).toBeDefined();
    });
    it("With an expired code — via date", async () => {
      const testDB = await getTestDB();
      const user = await insertUser();
      const company = await insertCompany({
        status: "active",
      });
      const workSeniority = await insertWorkSeniority();
      const workRole = await insertWorkRole();
      await insertWorkSeniorityAndRole({
        workRoleId: workRole.id,
        workSeniorityId: workSeniority.id,
      });
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() - 1000 * 60 * 60 * 24),
        userId: user.id,
        status: "expired",
        sourceId: "123",
      });
      await insertWorkEmail({
        confirmationTokenId: insertedConfirmationToken.id,
        userId: user.id,
        companyId: company.id,
      });

      const StartWorkEmailValidationResponse =
        await executeGraphqlOperationAsUser<
          CreateSalaryMutation,
          CreateSalaryMutationVariables
        >(
          {
            document: CreateSalary,
            variables: {
              input: {
                confirmationToken: insertedConfirmationToken.token,
                amount: 1000,
                companyId: company.id,
                countryCode: "US",
                currencyCode: "US",
                gender: Gender.Agender,
                typeOfEmployment: TypeOfEmployment.FullTime,
                workMetodology: WorkMetodology.Hybrid,
                workRoleId: workRole.id,
                workSeniorityId: workSeniority.id,
                genderOtherText: "",
                yearsOfExperience: 1,
              },
            },
          },
          user,
        );
      const confirmationToken =
        await testDB.query.confirmationTokenSchema.findFirst();

      if (!confirmationToken) {
        throw new Error("Confirmation token not found");
      }

      expect(StartWorkEmailValidationResponse.errors).toBeDefined();
    });
  });
});
