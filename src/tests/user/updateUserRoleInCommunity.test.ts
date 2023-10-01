import { it, describe, afterEach, assert } from "vitest";
import { executeGraphqlOperationAsUser, insertCommunity, insertEvent, insertEventToCommunity, insertUser, insertUserToCommunity, insertUserToEvent } from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import { faker } from "@faker-js/faker";
import { UpdateUserRoleInCommunity, UpdateUserRoleInCommunityMutation, UpdateUserRoleInCommunityMutationVariables } from "./updateUserRoleInCommunity.generated";

afterEach(() => {
  clearDatabase();
});

describe("User update role in communities", () => {
  it("It should a error, if has a member role", async () => {
    const user1 = await insertUser();
    const user2 = await insertUser();
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "member",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "member",
    });

    const response = await executeGraphqlOperationAsUser<
      UpdateUserRoleInCommunityMutation,
      UpdateUserRoleInCommunityMutationVariables
    >(
      {
        document: UpdateUserRoleInCommunity,
        variables: {
          input: {
            id: user2.id,
            communityId: community1.id,
            role: "admin",
          },
        },
      },
      user1,
    );

    assert.equal(response.errors?.length, 1);
    assert.equal(response.errors?.[0].message, "Not authorized");
  });
  it("It should a error, if has a volunteer role", async () => {
    const user1 = await insertUser();
    const user2 = await insertUser();
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "volunteer",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "member",
    });

    const response = await executeGraphqlOperationAsUser<
      UpdateUserRoleInCommunityMutation,
      UpdateUserRoleInCommunityMutationVariables
    >(
      {
        document: UpdateUserRoleInCommunity,
        variables: {
          input: {
            id: user2.id,
            communityId: community1.id,
            role: "admin",
          },
        },
      },
      user1,
    );

    assert.equal(response.errors?.length, 1);
    assert.equal(response.errors?.[0].message, "Not authorized");
  });
  it("Should update a user role in community if user is a superadmin", async () => {
    const user1 = await insertUser({
      isSuperAdmin: true,
    });
    const user2 = await insertUser();
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "member",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "member",
    });

    const response = await executeGraphqlOperationAsUser<
      UpdateUserRoleInCommunityMutation,
      UpdateUserRoleInCommunityMutationVariables
    >(
      {
        document: UpdateUserRoleInCommunity,
        variables: {
          input: {
            id: user2.id,
            communityId: community1.id,
            role: "admin",
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.updateUserRoleInCommunity?.id, user2.id);
  });
  it("Should update a user role in community if user is a community admin", async () => {
    const user1 = await insertUser();
    const user2 = await insertUser();
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "member",
    });

    const response = await executeGraphqlOperationAsUser<
      UpdateUserRoleInCommunityMutation,
      UpdateUserRoleInCommunityMutationVariables
    >(
      {
        document: UpdateUserRoleInCommunity,
        variables: {
          input: {
            id: user2.id,
            communityId: community1.id,
            role: "admin",
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.updateUserRoleInCommunity?.id, user2.id);
  });
});
