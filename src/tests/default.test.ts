import { it, describe, assert } from "vitest";
import { executeGraphqlOperation } from "~/tests/__fixtures";
import {
  Status,
  StatusQuery,
  StatusQueryVariables,
} from "~/tests/status.generated";

describe("Users Graphql Tests", () => {
  it("Should do a basic test", async () => {
    // No me gusta este ANY, pero por ahora nos desbloquea. hasta que hagamos
    // code-generation y podemos tener typed documents, es lo que hay. podriamos
    // hacer algo como esto:
    // - https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-document-nodes
    // o
    // - https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-type-graphql
    const response = await executeGraphqlOperation<
      StatusQuery,
      StatusQueryVariables
    >({
      document: Status,
    });
    assert.equal(response?.data?.status, "Hello, . We are up and running!");
  });
});
