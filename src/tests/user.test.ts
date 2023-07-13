import { it, describe } from "vitest";
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
    console.log(user, user2);
    console.log(response.errors[0]);
    // TODO Agregar asserts
  });
});
