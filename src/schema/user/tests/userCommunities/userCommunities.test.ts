import { it, describe, assert } from "vitest";

import {
  CommunitiesUsers,
  CommunitiesUsersQuery,
  CommunitiesUsersQueryVariables,
  SingleCommunityUsers,
  SingleCommunityUsersQuery,
  SingleCommunityUsersQueryVariables,
} from "~/schema/user/tests/userCommunities/getCommunitiesUsers.generated";
import {
  UsersAndCommunities,
  UsersAndCommunitiesQuery,
  UsersAndCommunitiesQueryVariables,
} from "~/schema/user/tests/userCommunities/getUsersCommunities.generated";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertUser,
  insertUserToCommunity,
} from "~/tests/fixtures";

describe("Users Communities Graphql Tests", () => {
  it("Should return a list of users with their communities", async () => {
    const user = await insertUser({
      isSuperAdmin: true,
    });
    const user2 = await insertUser();
    const community1 = await insertCommunity();

    await insertUserToCommunity({
      userId: user.id,
      communityId: community1.id,
      role: "member",
    });
    const response = await executeGraphqlOperationAsUser<
      UsersAndCommunitiesQuery,
      UsersAndCommunitiesQueryVariables
    >(
      {
        document: UsersAndCommunities,
      },
      user,
    );

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
    });
    const response = await executeGraphqlOperation<
      CommunitiesUsersQuery,
      CommunitiesUsersQueryVariables
    >({
      document: CommunitiesUsers,
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

  it("Should return an empty list of users for a community if no users are in that community", async () => {
    const community2 = await insertCommunity();
    const response = await executeGraphqlOperation<
      SingleCommunityUsersQuery,
      SingleCommunityUsersQueryVariables
    >({
      document: SingleCommunityUsers,
      variables: {
        id: community2.id,
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response?.data?.community?.users.length, 0);
  });
});
