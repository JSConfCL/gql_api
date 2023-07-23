import { it, describe, assert } from "vitest";
import { executeGraphqlOperation } from "~/tests/__fixtures";
import {
  Status,
  StatusQuery,
  StatusQueryVariables,
} from "~/tests/status.generated";

describe("Users Graphql Tests", () => {
  it("Should do a basic test", async () => {
    const response = await executeGraphqlOperation<
      StatusQuery,
      StatusQueryVariables
    >({
      document: Status,
    });
    assert.equal(response?.data?.status, "Hello, . We are up and running!");
  });
});
