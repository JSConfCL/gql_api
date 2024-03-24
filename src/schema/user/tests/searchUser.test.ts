/* eslint-disable @typescript-eslint/no-unused-vars */
import { it, describe, assert } from "vitest";

import { SearchableUserTags } from "~/generated/types";
import {
  UserSearch,
  UserSearchQuery,
  UserSearchQueryVariables,
} from "~/schema/user/tests/searchUser.generated";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsSuperAdmin,
  insertUser,
  insertUserTag,
  insertTag,
  executeGraphqlOperationAsUser,
} from "~/tests/fixtures";

describe("Search users by tag", () => {
  it("Should return 1 user when passed 1 tag", async () => {
    const user = await insertUser();
    const user2 = await insertUser();
    const tag = await insertTag({
      name: SearchableUserTags.CoreTeam,
    });
    const tag2 = await insertTag({
      name: SearchableUserTags.DevTeam,
    });

    const userTag = await insertUserTag({
      tagId: tag.id,
      userId: user.id,
    });
    const user2Tag = await insertUserTag({
      tagId: tag2.id,
      userId: user2.id,
    });
    const response = await executeGraphqlOperationAsSuperAdmin<
      UserSearchQuery,
      UserSearchQueryVariables
    >({
      document: UserSearch,
      variables: {
        input: {
          tags: [SearchableUserTags.CoreTeam],
        },
      },
    });
    assert.equal(response.errors, undefined);
    assert.isArray(response.data?.userSearch);
    assert.equal(response.data?.userSearch?.length, 1);
  });
  it("Should return correct of users when passed 1 tag", async () => {
    const user = await insertUser();
    const user2 = await insertUser();
    const tag = await insertTag({
      name: SearchableUserTags.CoreTeam,
    });
    const userTag = await insertUserTag({
      tagId: tag.id,
      userId: user.id,
    });
    const user2Tag = await insertUserTag({
      tagId: tag.id,
      userId: user2.id,
    });
    const response = await executeGraphqlOperationAsSuperAdmin<
      UserSearchQuery,
      UserSearchQueryVariables
    >({
      document: UserSearch,
      variables: {
        input: {
          tags: [SearchableUserTags.CoreTeam],
        },
      },
    });
    assert.equal(response.errors, undefined);
    assert.isArray(response.data?.userSearch);
    assert.equal(response.data?.userSearch?.length, 2);
  });
  it("Should return correct of users when passed multiple tags", async () => {
    const user = await insertUser();
    const user2 = await insertUser();
    const tag = await insertTag({
      name: SearchableUserTags.CoreTeam,
    });
    const tag2 = await insertTag({
      name: SearchableUserTags.DevTeam,
    });

    const userTag = await insertUserTag({
      tagId: tag.id,
      userId: user.id,
    });
    const user2Tag = await insertUserTag({
      tagId: tag2.id,
      userId: user2.id,
    });
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
    assert.equal(response.errors, undefined);
    assert.isArray(response.data?.userSearch);
    assert.equal(response.data?.userSearch?.length, 2);
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
    assert.equal(response.errors, undefined);
    assert.isArray(response.data?.userSearch);
    assert.equal(response.data?.userSearch?.length, 0);
  });
  it("Should fail if query is anonymous", async () => {
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
  it("Should fail if account is normal user ", async () => {
    const user = await insertUser();
    const response = await executeGraphqlOperationAsUser<
      UserSearchQuery,
      UserSearchQueryVariables
    >(
      {
        document: UserSearch,
        variables: {
          input: {},
        },
      },
      user,
    );
    assert.equal(response.errors?.length, 1);
    assert.equal(response.errors?.[0]?.message, "Unauthorized!");
  });
});
