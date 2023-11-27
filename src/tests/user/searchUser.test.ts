/* eslint-disable @typescript-eslint/no-unused-vars */
import { it, describe, assert, afterEach } from "vitest";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsSuperAdmin,
  insertUser,
  insertUserTag,
  insertTag,
} from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  UserSearch,
  UserSearchQuery,
  UserSearchQueryVariables,
} from "~/tests/user/searchUser.generated";
import { SearchableUserTags } from "../../generated/types";

afterEach(() => {
  clearDatabase();
});

describe("Search users by tag", () => {
  // it("Should return correct of users when passed one tag", async () => {
  //   const user = await insertUser({
  //     id: "1",
  //   });
  //   const user2 = await insertUser({
  //     id: "2",
  //   });
  //   const response = await executeGraphqlOperation<
  //     UsersQuery,
  //     UsersQueryVariables
  //   >({
  //     document: Users,
  //   });
  //   assert.equal(response.errors, undefined);
  //   assert.equal(response.data?.users.length, 2);
  //   assert.equal(response.data?.users[0].id, user.id);
  //   assert.equal(response.data?.users[1].id, user2.id);
  // });
  it.only("Should return correct of users when passed multiple tags", async () => {
    const user = await insertUser();
    const user2 = await insertUser();
    const tag = await insertTag({
      name: SearchableUserTags.CoreTeam,
    });
    const tag2 = await insertTag({
      name: SearchableUserTags.DevTeam,
    });

    console.log("-------------------------", tag.id, user.id);
    const userTag = await insertUserTag({
      tagId: tag.id,
      userId: user.id,
    });
    // const user2Tag = await insertUserTag({
    //   tagId: tag2.id,
    //   userId: user2.id,
    // });
    const response = await executeGraphqlOperationAsSuperAdmin<
      UserSearchQuery,
      UserSearchQueryVariables
    >({
      document: UserSearch,
      variables: {
        input: {
          tags: [SearchableUserTags.CoreTeam, SearchableUserTags.DevTeam],
        },
      },
    });
    console.log(response);
    // assert.equal(response.errors, undefined);
    // assert.isArray(response.data?.userSearch);
    // assert.equal(response.data?.userSearch?.length, 0);
  });
  it("Should return an empty list for no tags", async () => {
    const user = await insertUser();
    const user2 = await insertUser();
    const response = await executeGraphqlOperationAsSuperAdmin<
      UserSearchQuery,
      UserSearchQueryVariables
    >({
      document: UserSearch,
      variables: {
        input: {},
      },
    });
    console.log(response);
    assert.equal(response.errors, undefined);
    assert.isArray(response.data?.userSearch);
    assert.equal(response.data?.userSearch?.length, 0);
  });
  it("Should fail if account is not superadmin", async () => {
    const response = await executeGraphqlOperation<
      UserSearchQuery,
      UserSearchQueryVariables
    >({
      document: UserSearch,
      variables: {
        input: {},
      },
    });
    assert.equal(response.errors?.length, 1);
    assert.equal(response.errors?.[0]?.message, "Unauthorized!");
  });
});
