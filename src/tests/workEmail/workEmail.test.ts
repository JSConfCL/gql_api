import { it, describe, assert, afterEach } from "vitest";
import { executeGraphqlOperationAsUser, insertUser } from "~/tests/__fixtures";
import { clearDatabase, getTestDB } from "~/tests/__fixtures/databaseHelper";
import {
  ValidateWorkEmail,
  ValidateWorkEmailMutation,
  ValidateWorkEmailMutationVariables,
} from "./validateWorkEmail.generated";
import {
  StartWorkEmailValidation,
  StartWorkEmailValidationMutation,
  StartWorkEmailValidationMutationVariables,
} from "./startWorkEmailValidation.generated";
import { faker } from "@faker-js/faker";

afterEach(() => {
  clearDatabase();
});

describe("test the email validation process", () => {
  describe("Test should pass", () => {
    it("Should successfully go through the flow", async () => {
      const testDB = await getTestDB();
      const email = faker.internet.email();
      const user = await insertUser({
        email,
      });

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

      const { confirmationToken } = workEmailEntry;

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
            confirmationToken,
          },
        },
        user,
      );

      assert.equal(StartWorkEmailValidationResponse.errors, undefined);
      assert.equal(
        StartWorkEmailValidationResponse.data?.startWorkEmailValidation
          .isValidated,
        false,
      );

      assert.equal(ValidateWorkEmailResponse.errors, undefined);
      assert.equal(
        ValidateWorkEmailResponse.data?.validateWorkEmail.isValidated,
        true,
      );
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
      if (!workEmailEntry) {
        throw new Error("Work email entry not found");
      }

      const { confirmationToken } = workEmailEntry;

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
            confirmationToken,
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
  });
});
