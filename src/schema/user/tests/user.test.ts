import { it, describe, assert } from "vitest";

import {
  Users,
  UsersQuery,
  UsersQueryVariables,
} from "~/schema/user/tests/getUsers.generated";
import { executeGraphqlOperationAsUser, insertUser } from "~/tests/fixtures";

describe("Users Graphql Tests", () => {
  it("Should return a list of users", async () => {
    const user = await insertUser({
      isSuperAdmin: true,
    });
    const user2 = await insertUser();
    const response = await executeGraphqlOperationAsUser<
      UsersQuery,
      UsersQueryVariables
    >(
      {
        document: Users,
      },
      user,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.users.length, 2);
    assert.equal(response.data?.users[0].id, user.id);
    assert.equal(response.data?.users[1].id, user2.id);
  });
});
