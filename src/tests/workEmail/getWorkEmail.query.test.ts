import { faker } from "@faker-js/faker";
import { assert, describe, it } from "vitest";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsUser,
  insertCompany,
  insertConfirmationToken,
  insertUser,
  insertWorkEmail,
} from "~/tests/__fixtures";
import {
  WorkEmail,
  WorkEmailQuery,
  WorkEmailQueryVariables,
} from "./getWorkEmail.generated";

describe("test the work email query", () => {
  it("Should fetch the workEmail", async () => {
    const email = faker.internet.email();
    const company = await insertCompany();
    const user = await insertUser({
      email,
    });
    const insertedConfirmationToken = await insertConfirmationToken({
      source: "work_email",
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
      userId: user.id,
      status: "confirmed",
      sourceId: "123",
    });
    const insertedWorkEmail = await insertWorkEmail({
      companyId: company.id,
      userId: user.id,
      workEmail: email,
      confirmationTokenId: insertedConfirmationToken.id,
    });

    const query = await executeGraphqlOperationAsUser<
      WorkEmailQuery,
      WorkEmailQueryVariables
    >(
      {
        document: WorkEmail,
        variables: {
          email: insertedWorkEmail.workEmail,
        },
      },
      user,
    );

    assert.equal(query.errors, undefined);
    assert.equal(query.data?.workEmail.id, insertedWorkEmail.id);
    assert.equal(
      query.data?.workEmail.isValidated,
      Boolean(insertedWorkEmail.confirmationDate),
    );
  });

  it("Should fail for not authenticated users", async () => {
    const email = faker.internet.email();
    const company = await insertCompany();
    const user = await insertUser({
      email,
    });
    const insertedConfirmationToken = await insertConfirmationToken({
      source: "work_email",
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
      userId: user.id,
      status: "confirmed",
      sourceId: "123",
    });

    const insertedWorkEmail = await insertWorkEmail({
      companyId: company.id,
      userId: user.id,
      workEmail: email,
      confirmationTokenId: insertedConfirmationToken.id,
    });

    const query = await executeGraphqlOperation<
      WorkEmailQuery,
      WorkEmailQueryVariables
    >({
      document: WorkEmail,
      variables: {
        email: insertedWorkEmail.workEmail,
      },
    });

    assert.equal(query.errors?.length, 1);
  });

  it("Should fail for different user", async () => {
    const email = faker.internet.email();
    const company = await insertCompany();
    const user = await insertUser({
      email,
    });

    const user2 = await insertUser();
    const insertedConfirmationToken = await insertConfirmationToken({
      source: "work_email",
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
      userId: user.id,
      status: "confirmed",
      sourceId: "123",
    });

    const insertedWorkEmail = await insertWorkEmail({
      companyId: company.id,
      userId: user.id,
      workEmail: email,
      confirmationTokenId: insertedConfirmationToken.id,
    });

    const query = await executeGraphqlOperationAsUser<
      WorkEmailQuery,
      WorkEmailQueryVariables
    >(
      {
        document: WorkEmail,
        variables: {
          email: insertedWorkEmail.workEmail,
        },
      },
      user2,
    );

    assert.equal(query.errors?.length, 1);
  });

  it("Should fail if we don't pass the WorkEmail", async () => {
    const email = faker.internet.email();
    const company = await insertCompany();
    const user = await insertUser({
      email,
    });
    const insertedConfirmationToken = await insertConfirmationToken({
      source: "work_email",
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
      userId: user.id,
      status: "confirmed",
      sourceId: "123",
    });

    await insertWorkEmail({
      companyId: company.id,
      userId: user.id,
      workEmail: email,
      confirmationTokenId: insertedConfirmationToken.id,
    });

    const query = await executeGraphqlOperationAsUser<
      WorkEmailQuery,
      WorkEmailQueryVariables
    >(
      {
        document: WorkEmail,
      },
      user,
    );

    assert.equal(query.errors?.length, 1);
  });
});
