import { it, describe, afterEach, assert } from "vitest";
import { executeGraphqlOperationAsUser, insertUser } from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import { faker } from "@faker-js/faker";
import {
  UpdateUser,
  UpdateUserMutation,
  UpdateUserMutationVariables,
} from "./updateUser.generated";

afterEach(() => {
  clearDatabase();
});

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
            id: user1.id,
            ...fakeInput,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.updateUser?.id, user1.id);
    assert.deepEqual(response.data?.updateUser, {
      id: user1.id,
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
            id: user1.id,
            ...fakeInput,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.updateUser?.id, user1.id);
    assert.deepEqual(response.data?.updateUser, {
      id: user1.id,
      lastName: user1.lastName,
      bio: user1.bio,
      username: user1.username,
      ...fakeInput,
    });
  });
  it("Should update a user but is not the same user", async () => {
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
            id: user1.id,
            ...fakeInput,
          },
        },
      },
      user2,
    );

    assert.equal(response.errors?.[0].message, "Not authorized");
  });
});
