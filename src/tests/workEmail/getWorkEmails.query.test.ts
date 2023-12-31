import { faker } from "@faker-js/faker";
import { assert, describe, it } from "vitest";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsUser,
  insertCompany,
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

    const insertedWorkEmail = await insertWorkEmail({
      companyId: company.id,
      userId: user.id,
      workEmail: email,
      status: "confirmed",
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
    assert.equal(query.data?.workEmails?.[0]?.status, EmailStatus.Confirmed);
    assert.equal(
      query.data?.workEmails?.[0]?.workEmail,
      insertedWorkEmail.workEmail,
    );
    assert.equal(query.data?.workEmails?.[0].isValidated, true);
  });

  it("Should fail for not authenticated users", async () => {
    const email = faker.internet.email();
    const company = await insertCompany();
    const user = await insertUser({
      email,
    });

    await insertWorkEmail({
      companyId: company.id,
      userId: user.id,
      workEmail: email,
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

    await insertWorkEmail({
      companyId: company.id,
      userId: user.id,
      workEmail: email,
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
