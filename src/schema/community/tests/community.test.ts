import { v4 } from "uuid";
import { it, describe, assert } from "vitest";

import { CommnunityStatus } from "~/generated/types";
import {
  Communities,
  CommunitiesQuery,
  CommunitiesQueryVariables,
} from "~/schema/community/tests/getCommunities/getCommunities.generated";
import {
  Community,
  CommunityQuery,
  CommunityQueryVariables,
} from "~/schema/community/tests/getCommunity/getCommunity.generated";
import {
  executeGraphqlOperation,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
} from "~/tests/fixtures";

describe("Communities", () => {
  it("Should return an unfiltered list", async () => {
    const community1 = await insertCommunity();
    const community2 = await insertCommunity();
    const community3 = await insertCommunity();
    const response = await executeGraphqlOperation<
      CommunitiesQuery,
      CommunitiesQueryVariables
    >({
      document: Communities,
    });
    response;

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.communities.length, 3);
    assert.equal(response.data?.communities[0].id, community1.id);
    assert.equal(response.data?.communities[1].id, community2.id);
    assert.equal(response.data?.communities[2].id, community3.id);
  });
  it("Should return a filtered list by id", async () => {
    const community1 = await insertCommunity();
    await insertCommunity();
    const response = await executeGraphqlOperation<
      CommunitiesQuery,
      CommunitiesQueryVariables
    >({
      document: Communities,
      variables: {
        communityName: null,
        communityStatus: null,
        communityID: community1.id,
      },
    });

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.communities.length, 1);
    assert.equal(response.data?.communities[0].id, community1.id);
  });
  it("Should return a filtered list by name", async () => {
    const community1 = await insertCommunity({
      name: "Community 1",
    });
    const community2 = await insertCommunity({
      name: "Community 2",
    });
    await insertCommunity({
      name: "COMPLETELY_NON_RELATED_NAME",
    });
    const response = await executeGraphqlOperation<
      CommunitiesQuery,
      CommunitiesQueryVariables
    >({
      document: Communities,
      variables: {
        communityID: null,
        communityStatus: null,
        communityName: "COMMUNITY",
      },
    });

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.communities.length, 2);
    assert.equal(response.data?.communities[0].id, community1.id);
    assert.equal(response.data?.communities[1].id, community2.id);
  });
  it("Should return a filtered list by status", async () => {
    const community1 = await insertCommunity({
      status: "active",
    });
    const community2 = await insertCommunity({
      status: "active",
    });
    const community3 = await insertCommunity({
      status: "inactive",
    });
    const response = await executeGraphqlOperation<
      CommunitiesQuery,
      CommunitiesQueryVariables
    >({
      document: Communities,
      variables: {
        communityID: null,
        communityName: null,
        communityStatus: CommnunityStatus.Inactive,
      },
    });
    assert.equal(response.errors, undefined);
    assert.equal(response.data?.communities.length, 1);
    assert.equal(response.data?.communities[0].id, community3.id);
    const response2 = await executeGraphqlOperation<
      CommunitiesQuery,
      CommunitiesQueryVariables
    >({
      document: Communities,
      variables: {
        communityID: null,
        communityName: null,
        communityStatus: CommnunityStatus.Active,
      },
    });

    assert.equal(response2.errors, undefined);
    assert.equal(response2.data?.communities.length, 2);
    assert.equal(response2.data?.communities[0].id, community1.id);
    assert.equal(response2.data?.communities[1].id, community2.id);
  });
  it("Should do multiple filters", async () => {
    await insertCommunity({
      name: "Community 1",
      status: "active",
    });
    await insertCommunity({
      name: "Community 2",
      status: "inactive",
    });
    const community3 = await insertCommunity({
      name: "RANDOM_NAME",
      status: "inactive",
    });
    const response = await executeGraphqlOperation<
      CommunitiesQuery,
      CommunitiesQueryVariables
    >({
      document: Communities,
      variables: {
        communityID: null,
        communityStatus: CommnunityStatus.Inactive,
        communityName: "RANDOM",
      },
    });
    assert.equal(response.errors, undefined);
    assert.equal(response.data?.communities.length, 1);
    assert.equal(response.data?.communities[0].id, community3.id);
  });
  it("Should return only related events", async () => {
    async function createCommunityWithEvents(numberOfEvents: number) {
      const community = await insertCommunity();
      const events = [];

      for (let i = 0; i < numberOfEvents; i++) {
        const event = await insertEvent();
        await insertEventToCommunity({
          communityId: community.id,
          eventId: event.id,
        });

        events.push(event);
      }

      return { community, events };
    }

    const communitiesData = [
      await createCommunityWithEvents(0),
      await createCommunityWithEvents(1),
      await createCommunityWithEvents(2),
    ];

    const response = await executeGraphqlOperation<
      CommunitiesQuery,
      CommunitiesQueryVariables
    >({
      document: Communities,
    });

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.communities.length, communitiesData.length);

    const responseData = response.data;
    if (!responseData) {
      return;
    }

    communitiesData.forEach(({ community, events }, index) => {
      const responseCommunity = responseData.communities[index];

      assert.equal(responseCommunity.id, community.id);
      assert.equal(responseCommunity.events.length, events.length);

      responseCommunity.events.forEach((someResponseEvent) => {
        assert.exists(events.find((e) => e.id === someResponseEvent.id));
      });
    });
  });
});

describe("Community search", () => {
  it("Should error if called without arguments", async () => {
    await insertCommunity();
    await insertCommunity();
    const response = await executeGraphqlOperation<
      CommunityQuery,
      CommunityQueryVariables
    >({
      document: Community,
    });

    assert.exists(response.errors);
    assert.equal(response.errors?.length, 1);
  });
  it("Should filter by a community ID", async () => {
    const community1 = await insertCommunity();
    await insertCommunity();
    const response = await executeGraphqlOperation<
      CommunityQuery,
      CommunityQueryVariables
    >({
      document: Community,
      variables: {
        communityID: community1.id,
      },
    });
    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.community, {
      description: community1.description,
      id: community1.id,
      name: community1.name,
      status: community1.status as CommnunityStatus,
    });
  });
  it("Should return null on a non-existing id", async () => {
    await insertCommunity();
    await insertCommunity();
    const response = await executeGraphqlOperation<
      CommunityQuery,
      CommunityQueryVariables
    >({
      document: Community,
      variables: {
        communityID: v4(),
      },
    });

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.community, null);
  });
});
