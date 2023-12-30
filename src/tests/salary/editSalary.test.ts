import { v4 } from "uuid";
import { afterEach, describe, expect, it } from "vitest";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  insertAllowedCurrency,
  insertCompany,
  insertConfirmationToken,
  insertSalary,
  insertUser,
  insertWorkEmail,
  insertWorkRole,
} from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  Gender,
  TypeOfEmployment,
  WorkMetodology,
} from "../../generated/types";
import {
  UpdateSalary,
  UpdateSalaryMutation,
  UpdateSalaryMutationVariables,
} from "./mutations.generated";

afterEach(() => {
  clearDatabase();
});

const createSalary = async () => {
  const user = await insertUser();
  const company = await insertCompany({
    status: "active",
  });
  const workRole = await insertWorkRole();
  const insertedConfirmationToken = await insertConfirmationToken({
    source: "onboarding",
    validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
    userId: user.id,
    status: "pending",
    token: v4(),
    sourceId: "123",
  });
  const workEmail = await insertWorkEmail({
    confirmationTokenId: insertedConfirmationToken.id,
    userId: user.id,
  });
  const salary = await insertSalary({
    workEmailId: workEmail.id,
    amount: 1000,
    companyId: company.id,
    countryCode: "US",
    currencyCode: "US",
    gender: Gender.Agender,
    typeOfEmployment: TypeOfEmployment.FullTime,
    workMetodology: WorkMetodology.Hybrid,
    workRoleId: workRole.id,
    genderOtherText: "",
    yearsOfExperience: 1,
    userId: user.id,
  });
  return {
    salaryId: salary.id,
    confirmationToken: insertedConfirmationToken.token,
    user,
  };
};

describe("Salary creation", () => {
  describe("User has a valid token", () => {
    describe("Should update a salary", () => {
      it("For a user with a correct code", async () => {
        const { confirmationToken, salaryId, user } = await createSalary();
        const workRole2 = await insertWorkRole();

        const UpdateWorkEmail = await executeGraphqlOperationAsUser<
          UpdateSalaryMutation,
          UpdateSalaryMutationVariables
        >(
          {
            document: UpdateSalary,
            variables: {
              input: {
                salaryId: salaryId,
                confirmationToken: confirmationToken,
                amount: 100000,
                countryCode: "CLP",
                currencyCode: "CLP",
                gender: Gender.Female,
                typeOfEmployment: TypeOfEmployment.PartTime,
                workMetodology: WorkMetodology.Office,
                workRoleId: workRole2.id,
                genderOtherText: "something",
                yearsOfExperience: 2,
              },
            },
          },
          user,
        );

        expect(UpdateWorkEmail.errors).toBeUndefined();
        expect(UpdateWorkEmail.data?.updateSalary).toMatchObject({
          amount: 100000,
          countryCode: "CLP",
          currencyCode: "CLP",
          gender: Gender.Female,
          genderOtherText: "something",
          id: salaryId,
          typeOfEmployment: TypeOfEmployment.PartTime,
          workMetodology: WorkMetodology.Office,
          workRole: {
            id: workRole2.id,
            name: workRole2.name,
          },
          yearsOfExperience: 2,
        });
      });
    });
  });
  describe("Creation should fail", () => {
    it("With an annonymous user", async () => {
      const { confirmationToken, salaryId } = await createSalary();
      const workRole2 = await insertWorkRole();

      const UpdateWorkEmail = await executeGraphqlOperation<
        UpdateSalaryMutation,
        UpdateSalaryMutationVariables
      >({
        document: UpdateSalary,
        variables: {
          input: {
            salaryId: salaryId,
            confirmationToken: confirmationToken,
            amount: 100000,
            countryCode: "CLP",
            currencyCode: "CLP",
            gender: Gender.Female,
            typeOfEmployment: TypeOfEmployment.PartTime,
            workMetodology: WorkMetodology.Office,
            workRoleId: workRole2.id,
            genderOtherText: "something",
            yearsOfExperience: 2,
          },
        },
      });
      expect(UpdateWorkEmail.errors).toBeDefined();
    });
    it("For a SuperAdmin", async () => {
      const { confirmationToken, salaryId } = await createSalary();
      const workRole2 = await insertWorkRole();
      const UpdateWorkEmail = await executeGraphqlOperationAsSuperAdmin<
        UpdateSalaryMutation,
        UpdateSalaryMutationVariables
      >({
        document: UpdateSalary,
        variables: {
          input: {
            salaryId: salaryId,
            confirmationToken: confirmationToken,
            amount: 100000,
            countryCode: "CLP",
            currencyCode: "CLP",
            gender: Gender.Female,
            typeOfEmployment: TypeOfEmployment.PartTime,

            workMetodology: WorkMetodology.Office,
            workRoleId: workRole2.id,
            genderOtherText: "something",
            yearsOfExperience: 2,
          },
        },
      });
      expect(UpdateWorkEmail.errors).toBeDefined();
    });
    it("If the user using the code is not the same user that created it", async () => {
      const user2 = await insertUser();
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user2.id,
        status: "pending",
        token: v4(),
        sourceId: "123",
      });
      const { salaryId, user } = await createSalary();
      const workRole2 = await insertWorkRole();
      const UpdateWorkEmail = await executeGraphqlOperationAsUser<
        UpdateSalaryMutation,
        UpdateSalaryMutationVariables
      >(
        {
          document: UpdateSalary,
          variables: {
            input: {
              salaryId: salaryId,
              confirmationToken: insertedConfirmationToken.token,
              amount: 100000,
              countryCode: "CLP",
              currencyCode: "CLP",
              gender: Gender.Female,
              typeOfEmployment: TypeOfEmployment.PartTime,
              workMetodology: WorkMetodology.Office,
              workRoleId: workRole2.id,
              genderOtherText: "something",
              yearsOfExperience: 2,
            },
          },
        },
        user,
      );
      expect(UpdateWorkEmail.errors).toBeDefined();
    });
    it("With a wrong code", async () => {
      const { salaryId, user } = await createSalary();
      const workRole2 = await insertWorkRole();

      const UpdateWorkEmail = await executeGraphqlOperationAsUser<
        UpdateSalaryMutation,
        UpdateSalaryMutationVariables
      >(
        {
          document: UpdateSalary,
          variables: {
            input: {
              salaryId: salaryId,
              confirmationToken: "HELLA_RANDOM_CODE",
              amount: 100000,
              countryCode: "CLP",
              currencyCode: "CLP",
              gender: Gender.Female,
              typeOfEmployment: TypeOfEmployment.PartTime,
              workMetodology: WorkMetodology.Office,
              workRoleId: workRole2.id,
              genderOtherText: "something",
              yearsOfExperience: 2,
            },
          },
        },
        user,
      );
      expect(UpdateWorkEmail.errors).toBeDefined();
    });
    it("With a previously validated code", async () => {
      const { salaryId, user } = await createSalary();
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user.id,
        status: "confirmed",
        token: v4(),
        sourceId: "123",
      });
      const workRole2 = await insertWorkRole();

      const UpdateWorkEmail = await executeGraphqlOperationAsUser<
        UpdateSalaryMutation,
        UpdateSalaryMutationVariables
      >(
        {
          document: UpdateSalary,
          variables: {
            input: {
              salaryId: salaryId,
              confirmationToken: insertedConfirmationToken.token,
              amount: 100000,
              countryCode: "CLP",
              currencyCode: "CLP",
              gender: Gender.Female,
              typeOfEmployment: TypeOfEmployment.PartTime,
              workMetodology: WorkMetodology.Office,
              workRoleId: workRole2.id,
              genderOtherText: "something",
              yearsOfExperience: 2,
            },
          },
        },
        user,
      );
      expect(UpdateWorkEmail.errors).toBeDefined();
    });
    it("With a rejected code", async () => {
      const { salaryId, user } = await createSalary();
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user.id,
        status: "rejected",
        token: v4(),
        sourceId: "123",
      });
      const workRole2 = await insertWorkRole();

      const UpdateWorkEmail = await executeGraphqlOperationAsUser<
        UpdateSalaryMutation,
        UpdateSalaryMutationVariables
      >(
        {
          document: UpdateSalary,
          variables: {
            input: {
              salaryId: salaryId,
              confirmationToken: insertedConfirmationToken.token,
              amount: 100000,
              countryCode: "CLP",
              currencyCode: "CLP",
              gender: Gender.Female,
              typeOfEmployment: TypeOfEmployment.PartTime,
              workMetodology: WorkMetodology.Office,
              workRoleId: workRole2.id,
              genderOtherText: "something",
              yearsOfExperience: 2,
            },
          },
        },
        user,
      );
      expect(UpdateWorkEmail.errors).toBeDefined();
    });
    it("With an expired code", async () => {
      const { salaryId, user } = await createSalary();
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user.id,
        status: "expired",
        token: v4(),
        sourceId: "123",
      });
      const workRole2 = await insertWorkRole();
      const allowedCurrency2 = await insertAllowedCurrency();

      const UpdateWorkEmail = await executeGraphqlOperationAsUser<
        UpdateSalaryMutation,
        UpdateSalaryMutationVariables
      >(
        {
          document: UpdateSalary,
          variables: {
            input: {
              salaryId: salaryId,
              confirmationToken: insertedConfirmationToken.token,
              amount: 100000,
              countryCode: "CLP",
              gender: Gender.Female,
              typeOfEmployment: TypeOfEmployment.PartTime,
              currencyCode: allowedCurrency2.id,
              workMetodology: WorkMetodology.Office,
              workRoleId: workRole2.id,
              genderOtherText: "something",
              yearsOfExperience: 2,
            },
          },
        },
        user,
      );
      expect(UpdateWorkEmail.errors).toBeDefined();
    });
    it("With an expired code — via date", async () => {
      const { salaryId, user } = await createSalary();
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() - 1000 * 60 * 60 * 24),
        userId: user.id,
        status: "pending",
        token: v4(),
        sourceId: "123",
      });
      const workRole2 = await insertWorkRole();

      const UpdateWorkEmail = await executeGraphqlOperationAsUser<
        UpdateSalaryMutation,
        UpdateSalaryMutationVariables
      >(
        {
          document: UpdateSalary,
          variables: {
            input: {
              salaryId: salaryId,
              confirmationToken: insertedConfirmationToken.token,
              amount: 100000,
              countryCode: "CLP",
              currencyCode: "CLP",
              gender: Gender.Female,
              typeOfEmployment: TypeOfEmployment.PartTime,
              workMetodology: WorkMetodology.Office,
              workRoleId: workRole2.id,
              genderOtherText: "something",
              yearsOfExperience: 2,
            },
          },
        },
        user,
      );
      expect(UpdateWorkEmail.errors).toBeDefined();
    });
  });
});
