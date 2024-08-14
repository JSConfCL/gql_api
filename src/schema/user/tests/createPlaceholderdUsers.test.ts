import { faker } from "@faker-js/faker";
import { it, describe, assert } from "vitest";

import { executeGraphqlOperationAsSuperAdmin } from "~/tests/fixtures";

import {
  CreatePlaceholderdUsersMutationVariables,
  CreatePlaceholderdUsersMutation,
  CreatePlaceholderdUsers,
} from "./createPlaceholderdUsers.generated";

describe("CreatePlaceholderdUsers", () => {
  it("should be allowed for superadmins", async () => {
    const response = await executeGraphqlOperationAsSuperAdmin<
      CreatePlaceholderdUsersMutation,
      CreatePlaceholderdUsersMutationVariables
    >({
      document: CreatePlaceholderdUsers,
      variables: {
        input: {
          users: [
            {
              email: faker.internet.email(),
              name: faker.name.firstName(),
            },
            {
              email: faker.internet.email(),
              name: faker.name.firstName(),
            },
            {
              email: faker.internet.email(),
              name: faker.name.firstName(),
            },
          ],
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.createPlaceholderdUsers?.length, 3);
  });

  it("should return user information of all created users", async () => {
    const userData = {
      email: faker.internet.email(),
      name: faker.name.firstName(),
    };

    await executeGraphqlOperationAsSuperAdmin<
      CreatePlaceholderdUsersMutation,
      CreatePlaceholderdUsersMutationVariables
    >({
      document: CreatePlaceholderdUsers,
      variables: {
        input: {
          users: [userData],
        },
      },
    });

    const response = await executeGraphqlOperationAsSuperAdmin<
      CreatePlaceholderdUsersMutation,
      CreatePlaceholderdUsersMutationVariables
    >({
      document: CreatePlaceholderdUsers,
      variables: {
        input: {
          users: [
            userData,
            {
              email: faker.internet.email(),
              name: faker.name.firstName(),
            },
            {
              email: faker.internet.email(),
              name: faker.name.firstName(),
            },
          ],
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.createPlaceholderdUsers?.length, 3);
  });
});
