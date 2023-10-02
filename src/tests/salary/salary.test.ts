import { it, describe, assert, afterEach } from "vitest";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsUser,
  insertAllowedCurrency,
  insertCompany,
  insertConfirmationToken,
  insertUser,
  insertWorkRole,
} from "~/tests/__fixtures";
import { clearDatabase, getTestDB } from "~/tests/__fixtures/databaseHelper";
import {
  CreateSalary,
  CreateSalaryMutation,
  CreateSalaryMutationVariables,
} from "./mutations.generated";
// import {
//   StartWorkEmailValidation,
//   StartWorkEmailValidationMutation,
//   StartWorkEmailValidationMutationVariables,
// } from "./startWorkEmailValidation.generated";
import { faker } from "@faker-js/faker";
import {
  Gender,
  TypeOfEmployment,
  WorkMetodology,
} from "../../generated/types";
import { v4 } from "uuid";

afterEach(() => {
  clearDatabase();
});

describe("Salary creation", () => {
  describe("User has a valid token", () => {
    it.only("Should create a salary", async () => {
      const testDB = await getTestDB();
      const workRole = await insertWorkRole();
      const user = await insertUser();
      const company = await insertCompany({
        status: "active",
      });
      const allowedCurrency = await insertAllowedCurrency();
      const insertedConfirmationToken = await insertConfirmationToken({
        source: "onboarding",
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
        userId: user.id,
        status: "pending",
        token: v4(),
        sourceId: "123",
      });

      console.log({ workRole, user, company, allowedCurrency });
      console.log({ insertedConfirmationToken });

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
                currencyId: allowedCurrency.id,
                gender: Gender.Agender,
                typeOfEmployment: TypeOfEmployment.FullTime,
                workMetodology: WorkMetodology.Hybrid,
                workRoleId: workRole.id,
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
  describe("Test should fail", () => {
    it("If the user using the code is not the same user that created it", async () => {
      const testDB = await getTestDB();
      const email = faker.internet.email();
      const user = await insertUser({
        email,
      });

      const user2 = await insertUser();

      const StartWorkEmailValidationResponse =
        await executeGraphqlOperationAsUser<
          StartWorkEmailValidationMutation,
          StartWorkEmailValidationMutationVariables
        >(
          {
            document: StartWorkEmailValidation,
            variables: {
              email,
            },
          },
          user,
        );
      const workEmailEntry = await testDB.query.workEmailSchema.findFirst();
      const confirmationToken =
        await testDB.query.confirmationTokenSchema.findFirst();
      if (!workEmailEntry) {
        throw new Error("Work email entry not found");
      }

      if (!confirmationToken) {
        throw new Error("Confirmation token not found");
      }

      const ValidateWorkEmailResponse = await executeGraphqlOperationAsUser<
        ValidateWorkEmailMutation,
        ValidateWorkEmailMutationVariables
      >(
        {
          document: ValidateWorkEmail,
          variables: {
            confirmationToken: confirmationToken?.token,
          },
        },
        user2,
      );

      assert.equal(StartWorkEmailValidationResponse.errors, undefined);
      assert.equal(
        StartWorkEmailValidationResponse.data?.startWorkEmailValidation
          .isValidated,
        false,
      );

      assert.equal(ValidateWorkEmailResponse.errors?.length, 1);
    });
    it("With a wrong code", async () => {
      const testDB = await getTestDB();
      const email = faker.internet.email();
      const user = await insertUser({
        email,
      });

      const user2 = await insertUser();

      const StartWorkEmailValidationResponse =
        await executeGraphqlOperationAsUser<
          StartWorkEmailValidationMutation,
          StartWorkEmailValidationMutationVariables
        >(
          {
            document: StartWorkEmailValidation,
            variables: {
              email,
            },
          },
          user,
        );
      const workEmailEntry = await testDB.query.workEmailSchema.findFirst();
      if (!workEmailEntry) {
        throw new Error("Work email entry not found");
      }

      const ValidateWorkEmailResponse = await executeGraphqlOperationAsUser<
        ValidateWorkEmailMutation,
        ValidateWorkEmailMutationVariables
      >(
        {
          document: ValidateWorkEmail,
          variables: {
            confirmationToken: "12312",
          },
        },
        user2,
      );

      assert.equal(StartWorkEmailValidationResponse.errors, undefined);
      assert.equal(
        StartWorkEmailValidationResponse.data?.startWorkEmailValidation
          .isValidated,
        false,
      );

      assert.equal(ValidateWorkEmailResponse.errors?.length, 1);
    });
    it("Without an email", async () => {
      const email = faker.internet.email();
      const user = await insertUser({
        email,
      });
      const user2 = await insertUser();

      const StartWorkEmailValidationResponse =
        await executeGraphqlOperationAsUser<
          StartWorkEmailValidationMutation,
          StartWorkEmailValidationMutationVariables
        >(
          {
            document: StartWorkEmailValidation,
            variables: {
              email: "",
            },
          },
          user,
        );
      const ValidateWorkEmailResponse = await executeGraphqlOperationAsUser<
        ValidateWorkEmailMutation,
        ValidateWorkEmailMutationVariables
      >(
        {
          document: ValidateWorkEmail,
          variables: {
            confirmationToken: "12312",
          },
        },
        user2,
      );
      assert.equal(
        StartWorkEmailValidationResponse.errors?.[0]?.message,
        "Unexpected error.",
      );
      assert.equal(ValidateWorkEmailResponse.errors?.length, 1);
    });
    it("Without a user", async () => {
      const testDB = await getTestDB();
      const email = faker.internet.email();
      const StartWorkEmailValidationResponse = await executeGraphqlOperation<
        StartWorkEmailValidationMutation,
        StartWorkEmailValidationMutationVariables
      >({
        document: StartWorkEmailValidation,
        variables: {
          email,
        },
      });
      const workEmailEntry = await testDB.query.workEmailSchema.findFirst();
      const ValidateWorkEmailResponse = await executeGraphqlOperation<
        ValidateWorkEmailMutation,
        ValidateWorkEmailMutationVariables
      >({
        document: ValidateWorkEmail,
        variables: {
          confirmationToken: "12312",
        },
      });

      assert.equal(workEmailEntry, undefined);
      assert.equal(StartWorkEmailValidationResponse.errors?.length, 1);
      assert.equal(
        StartWorkEmailValidationResponse.errors?.[0]?.message,
        "User is not authenticated",
      );
      assert.equal(ValidateWorkEmailResponse.errors?.length, 1);
      assert.equal(
        ValidateWorkEmailResponse.errors?.[0]?.message,
        "User is not authenticated",
      );
    });
  });
});
