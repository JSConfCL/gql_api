import { faker } from "@faker-js/faker";
import { afterEach, assert, describe, it } from "vitest";
import {
  executeGraphqlOperationAsUser,
  insertCompany,
  insertUser,
  insertWorkEmail,
} from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  WorkEmail,
  WorkEmailQuery,
  WorkEmailQueryVariables,
} from "./getWorkEmail.generated";

afterEach(() => {
  clearDatabase();
});

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
      insertedWorkEmail.isConfirmed,
    );
  });
});
