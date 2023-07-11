import { it, describe } from "vitest";
import { insertUser } from "~/tests/seeds";

describe("Users Graphql Tests", () => {
  it("Should return a list of users", async () => {
    const user = await insertUser();
    console.log(user);
    return true;
  });
});
