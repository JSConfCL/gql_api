import { it, describe, assert, afterEach } from "vitest";
import {
  executeGraphqlOperation,
  insertCommunity,
  insertUser,
  insertUserToCommunity,
} from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  GetUsersAndCommunities,
  GetUsersAndCommunitiesQuery,
  GetUsersAndCommunitiesQueryVariables,
} from "~/tests/userCommunities/getUsersCommunities.generated";
import {
  GetCommunitiesUsers,
  GetCommunitiesUsersQuery,
  GetCommunitiesUsersQueryVariables,
} from "~/tests/userCommunities/getCommunitiesUsers.generated";

afterEach(() => {
  clearDatabase();
});

describe("Users Graphql Tests", () => {
  it("Should return a list of users with their communities", async () => {
    const user = await insertUser();
    const user2 = await insertUser();
    const community1 = await insertCommunity();
    await insertUserToCommunity({
      userId: user.id,
      communityId: community1.id,
      role: "member",
    });
    const response = await executeGraphqlOperation<
      GetUsersAndCommunitiesQuery,
      GetUsersAndCommunitiesQueryVariables
    >({
      document: GetUsersAndCommunities,
    });
    assert.equal(response.errors, undefined);
    assert.equal(response.data?.users.length, 2);
    assert.equal(response.data?.users[0].id, user.id);
    assert.equal(response.data?.users[0].communities.length, 1);
    assert.equal(response.data?.users[0].communities[0].id, community1.id);
    assert.equal(response.data?.users[1].id, user2.id);
    assert.equal(response.data?.users[1].communities.length, 0);
  });

  it("Should return a list of communities with their users", async () => {
    const user1 = await insertUser();
    const user2 = await insertUser();
    const community1 = await insertCommunity();
    const community2 = await insertCommunity();
    await insertUserToCommunity({
      userId: user1.id,
      communityId: community1.id,
      role: "member",
    });
    await insertUserToCommunity({
      userId: user2.id,
      communityId: community1.id,
      role: "member",
    });
    const response = await executeGraphqlOperation<
      GetCommunitiesUsersQuery,
      GetCommunitiesUsersQueryVariables
    >({
      document: GetCommunitiesUsers,
    });
    const userIds =
      response?.data?.communities?.[0]?.users?.map((el) => el.id) ?? [];
    assert.equal(response.errors, undefined);
    assert.equal(response.data?.communities.length, 2);
    assert.equal(response.data?.communities[0].id, community1.id);
    assert.equal(response.data?.communities[1].id, community2.id);
    assert.equal(response.data?.communities[0].users.length, 2);
    assert.oneOf(user1.id, userIds, "Could not find user");
    assert.oneOf(user2.id, userIds, "Could not find user");
  });
});
