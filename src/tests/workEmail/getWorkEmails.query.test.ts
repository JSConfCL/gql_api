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
  WorkEmails,
  WorkEmailsQuery,
  WorkEmailsQueryVariables,
} from "./getWorkEmails.generated";
import { EmailStatus } from "../../generated/types";

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
      status: "pending",
      sourceId: "123",
    });

    const insertedWorkEmail = await insertWorkEmail({
      companyId: company.id,
      userId: user.id,
      workEmail: email,
      confirmationTokenId: insertedConfirmationToken.id,
    });
    const query = await executeGraphqlOperationAsUser<
      WorkEmailsQuery,
      WorkEmailsQueryVariables
    >(
      {
        document: WorkEmails,
      },
      user,
    );

    assert.equal(query.errors, undefined);
    assert.equal(query.data?.workEmails?.length, 1);
    assert.equal(query.data?.workEmails?.[0]?.status, EmailStatus.Pending);
    assert.equal(
      query.data?.workEmails?.[0]?.workEmail,
      insertedWorkEmail.workEmail,
    );
    assert.equal(query.data?.workEmails?.[0].isValidated, false);
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

    await insertWorkEmail({
      companyId: company.id,
      userId: user.id,
      workEmail: email,
      confirmationTokenId: insertedConfirmationToken.id,
    });

    const query = await executeGraphqlOperation<
      WorkEmailsQuery,
      WorkEmailsQueryVariables
    >({
      document: WorkEmails,
    });

    assert.equal(query.errors?.length, 1);
  });

  it("Should not return emails for different user", async () => {
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
    await insertWorkEmail({
      companyId: company.id,
      userId: user.id,
      workEmail: email,
      confirmationTokenId: insertedConfirmationToken.id,
    });

    const query = await executeGraphqlOperationAsUser<
      WorkEmailsQuery,
      WorkEmailsQueryVariables
    >(
      {
        document: WorkEmails,
      },
      user2,
    );

    assert.equal(query.data?.workEmails?.length, 0);
  });
});
