import { it, describe, assert, afterEach } from "vitest";
import {
  executeGraphqlOperation,
  insertCommunity,
  insertUser,
  insertUserToCommunity,
} from "~/tests/fixtures";
import gql from "graphql-tag";
import { clearDatabase } from "~/tests/fixtures/databaseHelper";
import { selectUsersSchema } from "~/datasources/db/schema";

const getUsersQuery = gql/* GraphQL */ `
  {
    users {
      id
      name
      email
      communities {
        description
        id
        name
        status
      }
    }
  }
`;

const getCommunitiesQuery = gql/* GraphQL */ `
  {
    communities {
      description
      id
      users {
        id
        communities {
          id
        }
      }
    }
  }
`;

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
    const response = await executeGraphqlOperation({
      document: getUsersQuery,
    });
    // Odio estos ANY. Pero por ahora nos desbloquea. hasta que hagamos
    // code-generation y podemos tener typed documents... es lo que hay 😅
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.users.length, 2);
    assert.equal((response as any).data.users[0].id, user.id);
    assert.equal((response as any).data.users[0].communities.length, 1);
    assert.equal(
      (response as any).data.users[0].communities[0].id,
      community1.id,
    );
    assert.equal((response as any).data.users[1].id, user2.id);
    assert.equal((response as any).data.users[1].communities.length, 0);
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
    const response = await executeGraphqlOperation({
      document: getCommunitiesQuery,
    });

    console.log(
      "(response as any).data.communities[0].users[0]",
      (response as any).data.communities[0].users[0],
    );
    console.log(
      "(response as any).data.communities[0].users[0]",
      (response as any).data.communities[0].users[1],
    );
    // Odio estos ANY. Pero por ahora nos desbloquea. hasta que hagamos
    // code-generation y podemos tener typed documents... es lo que hay 😅
    const userIds = (
      (response as any).data.communities[0]
        .users as (typeof selectUsersSchema)["_type"][]
    ).map((el) => el.id);
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.communities.length, 2);
    assert.equal((response as any).data.communities[0].id, community1.id);
    assert.equal((response as any).data.communities[1].id, community2.id);
    assert.equal((response as any).data.communities[0].users.length, 2);
    assert.oneOf(user1.id, userIds, "Could not find user");
    assert.oneOf(user2.id, userIds, "Could not find user");
  });
});
