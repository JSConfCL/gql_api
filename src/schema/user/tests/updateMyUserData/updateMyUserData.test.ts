import { faker } from "@faker-js/faker";
import { it, describe, assert } from "vitest";

import {
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  insertUser,
} from "~/tests/fixtures";

import {
  UpdateMyUserDataMutationVariables,
  UpdateMyUserDataMutation,
  UpdateMyUserData,
} from "./updateMyUserData.generated";

describe("UpdateMyUserData", () => {
  it("I Should be able to update my data", async () => {
    const user = await insertUser();

    const city = faker.location.city();
    const countryOfResidence = faker.location.country();
    const worksInOrganization = true;
    const organizationName = faker.company.name();
    const roleInOrganization = faker.name.jobTitle();

    const response = await executeGraphqlOperationAsUser<
      UpdateMyUserDataMutation,
      UpdateMyUserDataMutationVariables
    >(
      {
        document: UpdateMyUserData,
        variables: {
          input: {
            city,
            countryOfResidence,
            worksInOrganization,
            organizationName,
            roleInOrganization,
          },
        },
      },
      user,
    );

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.updateMyUserData.id, user.id);

    assert.equal(response.data?.updateMyUserData.userData?.city, city);

    assert.equal(
      response.data?.updateMyUserData.userData?.countryOfResidence,
      countryOfResidence,
    );

    assert.equal(
      response.data?.updateMyUserData.userData?.worksInOrganization,
      worksInOrganization,
    );

    assert.equal(
      response.data?.updateMyUserData.userData?.organizationName,
      organizationName,
    );

    assert.equal(
      response.data?.updateMyUserData.userData?.roleInOrganization,
      roleInOrganization,
    );
  });
});
