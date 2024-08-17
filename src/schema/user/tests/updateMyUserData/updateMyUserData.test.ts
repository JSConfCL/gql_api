import { faker } from "@faker-js/faker";
import { it, describe, assert } from "vitest";

import {
  executeGraphqlOperationAsUser,
  insertEvent,
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
    const event = await insertEvent();

    const city = faker.location.city();
    const countryOfResidence = faker.location.country();
    const worksInOrganization = true;
    const organizationName = faker.company.name();
    const roleInOrganization = faker.name.jobTitle();
    const rut = faker.lorem.text();
    const foodAllergies = faker.lorem.words(3);
    const emergencyPhoneNumber = faker.phone.number();

    const response = await executeGraphqlOperationAsUser<
      UpdateMyUserDataMutation,
      UpdateMyUserDataMutationVariables
    >(
      {
        document: UpdateMyUserData,
        variables: {
          input: {
            eventId: event.id,
            city,
            countryOfResidence,
            worksInOrganization,
            organizationName,
            roleInOrganization,
            rut,
            foodAllergies,
            emergencyPhoneNumber,
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

  it("I Should be able to edit my data", async () => {
    const user = await insertUser();
    const event = await insertEvent();

    await executeGraphqlOperationAsUser<
      UpdateMyUserDataMutation,
      UpdateMyUserDataMutationVariables
    >(
      {
        document: UpdateMyUserData,
        variables: {
          input: {
            city: faker.location.city(),
            countryOfResidence: faker.location.country(),
            worksInOrganization: true,
            organizationName: faker.company.name(),
            roleInOrganization: faker.name.jobTitle(),
            eventId: event.id,
            rut: faker.lorem.text(),
            foodAllergies: faker.lorem.words(3),
            emergencyPhoneNumber: faker.phone.number(),
          },
        },
      },
      user,
    );

    const city = faker.location.city();
    const countryOfResidence = faker.location.country();
    const worksInOrganization = true;
    const organizationName = faker.company.name();
    const roleInOrganization = faker.name.jobTitle();
    const rut = faker.lorem.text();
    const foodAllergies = faker.lorem.words(3);
    const emergencyPhoneNumber = faker.phone.number();

    const response = await executeGraphqlOperationAsUser<
      UpdateMyUserDataMutation,
      UpdateMyUserDataMutationVariables
    >(
      {
        document: UpdateMyUserData,
        variables: {
          input: {
            eventId: event.id,
            city,
            countryOfResidence,
            worksInOrganization,
            organizationName,
            roleInOrganization,
            rut,
            foodAllergies,
            emergencyPhoneNumber,
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
