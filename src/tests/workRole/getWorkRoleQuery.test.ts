import { faker } from "@faker-js/faker";
import { assert, describe, it } from "vitest";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsUser,
  insertUser,
  insertWorkSeniorityAndRole,
} from "~/tests/__fixtures";
import {
  GetWorkRolesAndSeniorities,
  GetWorkRolesAndSenioritiesQuery,
  GetWorkRolesAndSenioritiesQueryVariables,
} from "./getWorkRoleQuery.generated";

describe("Fetch work roles and seniority", () => {
  it("Should with with authenticated user", async () => {
    const email = faker.internet.email();
    const user = await insertUser({
      email,
    });

    const workSeniorityAndRole1 = await insertWorkSeniorityAndRole();
    await insertWorkSeniorityAndRole({
      workRoleId: workSeniorityAndRole1.workRoleId,
    });
    await insertWorkSeniorityAndRole();

    const query = await executeGraphqlOperationAsUser<
      GetWorkRolesAndSenioritiesQuery,
      GetWorkRolesAndSenioritiesQueryVariables
    >(
      {
        document: GetWorkRolesAndSeniorities,
      },
      user,
    );

    assert.equal(query.errors, undefined);
    assert.equal(query.data?.workRoles?.length, 2);
    assert.equal(query.data?.workRoles?.[0]?.seniorities?.length, 2);
    assert.equal(query.data?.workRoles?.[1]?.seniorities?.length, 1);
  });
  it("Should fail for anonuymous user", async () => {
    const email = faker.internet.email();
    const user = await insertUser({
      email,
    });

    const workSeniorityAndRole1 = await insertWorkSeniorityAndRole();
    await insertWorkSeniorityAndRole({
      workRoleId: workSeniorityAndRole1.workRoleId,
    });
    await insertWorkSeniorityAndRole();

    const query = await executeGraphqlOperation<
      GetWorkRolesAndSenioritiesQuery,
      GetWorkRolesAndSenioritiesQueryVariables
    >({
      document: GetWorkRolesAndSeniorities,
    });

    assert.equal(query.errors?.length, 1);
  });
});
