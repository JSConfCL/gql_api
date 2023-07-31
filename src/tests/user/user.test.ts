import { it, describe, assert, afterEach } from "vitest";
import { executeGraphqlOperation, insertUser } from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  Users,
  UsersQuery,
  UsersQueryVariables,
} from "~/tests/user/getUsers.generated";

afterEach(() => {
  clearDatabase();
});

describe("Users Graphql Tests", () => {
  it("Should return a list of users", async () => {
    const user = await insertUser({
      id: "1",
    });
    const user2 = await insertUser({
      id: "2",
    });
    const response = await executeGraphqlOperation<
      UsersQuery,
      UsersQueryVariables
    >({
      document: Users,
    });
    assert.equal(response.errors, undefined);
    assert.equal(response.data?.users.length, 2);
    assert.equal(response.data?.users[0].id, user.id);
    assert.equal(response.data?.users[1].id, user2.id);
  });
  it("Should return a list of users 2", async () => {
    const user = await insertUser();
    const user2 = await insertUser();
    const response = await executeGraphqlOperation<
      UsersQuery,
      UsersQueryVariables
    >({
      document: Users,
    });
    assert.equal(response.errors, undefined);
    assert.equal(response.data?.users.length, 2);
    assert.equal(response.data?.users[0].id, user.id);
    assert.equal(response.data?.users[1].id, user2.id);
  });
});
