import { it, describe, assert } from "vitest";

import { executeGraphqlOperation } from "~/tests/fixtures";
import {
  Status,
  StatusQuery,
  StatusQueryVariables,
} from "~/tests/status.generated";

describe("Default Tests", () => {
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
