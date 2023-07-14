import { it, describe, assert } from "vitest";
import { executeGraphqlOperation, insertUser } from "~/tests/fixtures";
import gql from "graphql-tag";

const getUsersQuery = gql/* GraphQL */ `
  {
    users {
      id
      name
      email
    }
  }
`;

describe("Users Graphql Tests", () => {
  it("Should return a list of users", async () => {
    const user = await insertUser();
    const user2 = await insertUser();
    const response = await executeGraphqlOperation({
      document: getUsersQuery,
    });
    // Odio estos ANY. Pero por ahora nos desbloquea. hasta que hagamos
    // code-generation y podemos tener typed documents... es lo que hay 😅
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.users.length, 2);
    assert.equal((response as any).data.users[0].id, user.id);
    assert.equal((response as any).data.users[1].id, user2.id);
  });
});
