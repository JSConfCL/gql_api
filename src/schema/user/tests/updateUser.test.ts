import { faker } from "@faker-js/faker";
import { it, describe, assert } from "vitest";

import { executeGraphqlOperationAsUser, insertUser } from "~/tests/fixtures";

import {
  UpdateUser,
  UpdateUserMutation,
  UpdateUserMutationVariables,
} from "./updateUser.generated";

describe("User", () => {
  it("Should update a user, all fields", async () => {
    const user1 = await insertUser();
    const fakeInput = {
      name: faker.person.firstName(),
      lastName: faker.person.lastName(),
      bio: faker.lorem.paragraph(3),
      username: faker.internet.userName(),
    };
    const response = await executeGraphqlOperationAsUser<
      UpdateUserMutation,
      UpdateUserMutationVariables
    >(
      {
        document: UpdateUser,
        variables: {
          input: {
            id: user1.oldId,
            ...fakeInput,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.updateUser?.id, user1.oldId);
    assert.deepEqual(response.data?.updateUser, {
      id: user1.oldId,
      ...fakeInput,
    });
  });
  it("Should update a user, only name", async () => {
    const user1 = await insertUser();
    const fakeInput = {
      name: faker.person.firstName(),
    };
    const response = await executeGraphqlOperationAsUser<
      UpdateUserMutation,
      UpdateUserMutationVariables
    >(
      {
        document: UpdateUser,
        variables: {
          input: {
            id: user1.oldId,
            ...fakeInput,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.updateUser?.id, user1.oldId);
    assert.deepEqual(response.data?.updateUser, {
      id: user1.oldId,
      lastName: user1.lastName,
      bio: user1.bio,
      username: user1.username,
      ...fakeInput,
    });
  });
  it("It should throw an error, if not the same user", async () => {
    const user1 = await insertUser();
    const user2 = await insertUser();
    const fakeInput = {
      name: faker.person.firstName(),
    };
    const response = await executeGraphqlOperationAsUser<
      UpdateUserMutation,
      UpdateUserMutationVariables
    >(
      {
        document: UpdateUser,
        variables: {
          input: {
            id: user1.oldId,
            ...fakeInput,
          },
        },
      },
      user2,
    );

    assert.equal(response.errors?.[0].message, "Not authorized");
  });
});
