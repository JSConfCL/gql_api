import { assert, describe, it } from "vitest";

import {
  executeGraphqlOperation,
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertTicketTemplate,
  insertUser,
  insertUserToCommunity,
} from "~/tests/fixtures";

import {
  SingleEventTickets,
  SingleEventTicketsQuery,
  SingleEventTicketsQueryVariables,
} from "./singleEventTickets.generated";

const createAllTickets = async (eventId: string) => {
  const ticket = await insertTicketTemplate({
    eventId: eventId,
    status: "active",
    visibility: "public",
  });
  const ticket2 = await insertTicketTemplate({
    eventId: eventId,
    status: "active",
    visibility: "private",
  });
  const ticket3 = await insertTicketTemplate({
    eventId: eventId,
    status: "active",
    visibility: "unlisted",
  });
  const ticket4 = await insertTicketTemplate({
    eventId: eventId,
    status: "inactive",
    visibility: "public",
  });
  const ticket5 = await insertTicketTemplate({
    eventId: eventId,
    status: "inactive",
    visibility: "private",
  });
  const ticket6 = await insertTicketTemplate({
    eventId: eventId,
    status: "inactive",
    visibility: "unlisted",
  });

  return [ticket, ticket2, ticket3, ticket4, ticket5, ticket6] as const;
};

describe("Should get an event and its tickets", () => {
  it("as a User", async () => {
    const user1 = await insertUser({
      isSuperAdmin: false,
    });
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const [ticket] = await createAllTickets(event1.id);

    const response = await executeGraphqlOperationAsUser<
      SingleEventTicketsQuery,
      SingleEventTicketsQueryVariables
    >(
      {
        document: SingleEventTickets,
        variables: {
          id: event1.id,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.event?.tickets?.length, 1);
    assert.equal(response.data?.event?.tickets[0]?.id, ticket.id);
  });
  it("as an ADMIN", async () => {
    const user1 = await insertUser({});
    const community1 = await insertCommunity();
    await insertUserToCommunity({
      oldUserId: user1.oldId,
      communityId: community1.id,
      role: "admin",
    });
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const [ticket, ticket2, ticket3, ticket4, ticket5, ticket6] =
      await createAllTickets(event1.id);

    const response = await executeGraphqlOperationAsUser<
      SingleEventTicketsQuery,
      SingleEventTicketsQueryVariables
    >(
      {
        document: SingleEventTickets,
        variables: {
          id: event1.id,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.event?.tickets?.length, 6);
    assert.equal(response.data?.event?.tickets[0]?.id, ticket.id);
    assert.equal(response.data?.event?.tickets[1]?.id, ticket2.id);
    assert.equal(response.data?.event?.tickets[2]?.id, ticket3.id);
    assert.equal(response.data?.event?.tickets[3]?.id, ticket4.id);
    assert.equal(response.data?.event?.tickets[4]?.id, ticket5.id);
    assert.equal(response.data?.event?.tickets[5]?.id, ticket6.id);
  });
  it("as a Collaborator", async () => {
    const user1 = await insertUser({});
    const community1 = await insertCommunity();
    await insertUserToCommunity({
      oldUserId: user1.oldId,
      communityId: community1.id,
      role: "collaborator",
    });
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const [ticket] = await createAllTickets(event1.id);

    const response = await executeGraphqlOperationAsUser<
      SingleEventTicketsQuery,
      SingleEventTicketsQueryVariables
    >(
      {
        document: SingleEventTickets,
        variables: {
          id: event1.id,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.event?.tickets?.length, 1);
    assert.equal(response.data?.event?.tickets[0]?.id, ticket.id);
  });
  it("as an anonymous query", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const [ticket] = await createAllTickets(event1.id);

    const response = await executeGraphqlOperation<
      SingleEventTicketsQuery,
      SingleEventTicketsQueryVariables
    >({
      document: SingleEventTickets,
      variables: {
        id: event1.id,
      },
    });

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.event?.tickets?.length, 1);
    assert.equal(response.data?.event?.tickets[0]?.id, ticket.id);
  });
});
