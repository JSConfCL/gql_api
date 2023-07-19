import { it, describe, assert, afterEach } from "vitest";
import { executeGraphqlOperation, insertCommunity } from "~/tests/fixtures";
import gql from "graphql-tag";
import { clearDatabase } from "~/tests/fixtures/databaseHelper";

const getCommunities = gql/* GraphQL */ `
  query getCommunities(
    $communityID: String
    $communityName: String
    $communityStatus: CommnunityStatus
  ) {
    communities(
      id: $communityID
      name: $communityName
      status: $communityStatus
    ) {
      description
      id
      name
      status
    }
  }
`;

const getCommunityWithVariables = gql/* GraphQL */ `
  query getCommunity($communityID: String!) {
    community(id: $communityID) {
      description
      id
      name
      status
    }
  }
`;

afterEach(() => {
  clearDatabase();
});

describe("Communities", () => {
  it("Should return an unfiltered list", async () => {
    const community1 = await insertCommunity();
    const community2 = await insertCommunity();
    const community3 = await insertCommunity();
    const response = await executeGraphqlOperation({
      document: getCommunities,
    });

    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.communities.length, 3);
    assert.equal((response as any).data.communities[0].id, community1.id);
    assert.equal((response as any).data.communities[1].id, community2.id);
    assert.equal((response as any).data.communities[2].id, community3.id);
  });
  it("Should return a filtered list by id", async () => {
    const community1 = await insertCommunity();
    const community2 = await insertCommunity();
    const response = await executeGraphqlOperation({
      document: getCommunities,
      variables: {
        communityID: community1.id,
      },
    });

    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.communities.length, 1);
    assert.equal((response as any).data.communities[0].id, community1.id);
  });
  it("Should return a filtered list by name", async () => {
    const community1 = await insertCommunity({
      name: "Community 1",
    });
    const community2 = await insertCommunity({
      name: "Community 2",
    });
    const community3 = await insertCommunity({
      name: "COMPLETELY_NON_RELATED_NAME",
    });
    const response = await executeGraphqlOperation({
      document: getCommunities,
      variables: {
        communityName: "COMMUNITY",
      },
    });

    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.communities.length, 2);
    assert.equal((response as any).data.communities[0].id, community1.id);
    assert.equal((response as any).data.communities[1].id, community2.id);
  });
  it("Should return a filtered list by status", async () => {
    const community1 = await insertCommunity();
    const community2 = await insertCommunity();
    const community3 = await insertCommunity({
      status: "inactive",
    });
    const response = await executeGraphqlOperation({
      document: getCommunities,
      variables: {
        communityStatus: "inactive",
      },
    });
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.communities.length, 1);
    assert.equal((response as any).data.communities[0].id, community3.id);
    const response2 = await executeGraphqlOperation({
      document: getCommunities,
      variables: {
        communityStatus: "active",
      },
    });

    assert.equal((response2 as any).errors, undefined);
    assert.equal((response2 as any).data.communities.length, 2);
    assert.equal((response2 as any).data.communities[0].id, community1.id);
    assert.equal((response2 as any).data.communities[1].id, community2.id);
  });
  it("Should do multiple filters", async () => {
    const community1 = await insertCommunity({
      name: "Community 1",
      status: "active",
    });
    const community2 = await insertCommunity({
      name: "Community 2",
      status: "inactive",
    });
    const community3 = await insertCommunity({
      name: "RANDOM_NAME",
      status: "inactive",
    });
    const response = await executeGraphqlOperation({
      document: getCommunities,
      variables: {
        communityStatus: "inactive",
        communityName: "RANDOM",
      },
    });
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.communities.length, 1);
    assert.equal((response as any).data.communities[0].id, community3.id);
  });
});

describe("Community search", () => {
  it("Should error if called without arguments", async () => {
    await insertCommunity();
    await insertCommunity();
    const response = await executeGraphqlOperation({
      document: getCommunityWithVariables,
    });

    assert.exists((response as any).errors);
    assert.equal((response as any).errors.length, 1);
  });
  it("Should filter by a community ID", async () => {
    const community1 = await insertCommunity();
    await insertCommunity();
    const response = await executeGraphqlOperation({
      document: getCommunityWithVariables,
      variables: {
        communityID: community1.id,
      },
    });
    assert.equal((response as any).errors, undefined);
    assert.deepEqual((response as any).data.community, {
      description: community1.description,
      id: community1.id,
      name: community1.name,
      status: community1.status,
    });
  });
  it("Should return null on a non-existing id", async () => {
    await insertCommunity();
    await insertCommunity();
    const response = await executeGraphqlOperation({
      document: getCommunityWithVariables,
      variables: {
        communityID: "some-non-existing-id",
      },
    });

    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.community, null);
  });
});
