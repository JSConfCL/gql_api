import { it, describe, assert, afterEach } from "vitest";
import { executeGraphqlOperation, insertUser } from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  GetUsers,
  GetUsersQuery,
  GetUsersQueryVariables,
} from "~/tests/user/getUsers.generated";

afterEach(() => {
  clearDatabase();
});

describe("Users Graphql Tests", () => {
  it("Should return a list of users", async () => {
    const user = await insertUser();
    const user2 = await insertUser();
    const response = await executeGraphqlOperation<
      GetUsersQuery,
      GetUsersQueryVariables
    >({
      document: GetUsers,
    });
    // Odio estos ANY. Pero por ahora nos desbloquea. hasta que hagamos
    // code-generation y podemos tener typed documents... es lo que hay 😅
    assert.equal(response.errors, undefined);
    assert.equal(response.data?.users.length, 2);
    assert.equal(response.data?.users[0].id, user.id);
    assert.equal(response.data?.users[1].id, user2.id);
  });
  it("Should return a list of users 2", async () => {
    const user = await insertUser();
    const user2 = await insertUser();
    const response = await executeGraphqlOperation<
      GetUsersQuery,
      GetUsersQueryVariables
    >({
      document: GetUsers,
    });
    // Odio estos ANY. Pero por ahora nos desbloquea. hasta que hagamos
    // code-generation y podemos tener typed documents... es lo que hay 😅
    assert.equal(response.errors, undefined);
    assert.equal(response.data?.users.length, 2);
    assert.equal(response.data?.users[0].id, user.id);
    assert.equal(response.data?.users[1].id, user2.id);
  });
});
