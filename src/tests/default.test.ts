import { it, describe, assert } from "vitest";
import { executeGraphqlOperation } from "~/tests/fixtures";
import gql from "graphql-tag";

const statusQuery = gql/* GraphQL */ `
  query Status {
    status
  }
`;

describe("Users Graphql Tests", () => {
  it("Should return a list of users", async () => {
    // No me gusta este ANY, pero por ahora nos desbloquea. hasta que hagamos
    // code-generation y podemos tener typed documents, es lo que hay. podriamos
    // hacer algo como esto:
    // - https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-document-nodes
    // o
    // - https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-type-graphql
    const response: any = await executeGraphqlOperation({
      document: statusQuery,
    });
    assert.equal(response?.data?.status, "Hello, . We are up and running!");
  });
});
