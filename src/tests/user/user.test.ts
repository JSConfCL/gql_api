import { it, describe, assert } from "vitest";
import { executeGraphqlOperation, insertUser } from "~/tests/__fixtures";
import {
  Users,
  UsersQuery,
  UsersQueryVariables,
} from "~/tests/user/getUsers.generated";

describe("Users Graphql Tests", () => {
  it("Should return a list of users", async () => {
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
