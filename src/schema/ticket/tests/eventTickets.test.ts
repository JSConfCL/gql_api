import { assert, describe, it } from "vitest";

import {
  executeGraphqlOperation,
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertTicketTemplate,
  insertUser,
} from "~/tests/fixtures";

import {
  EventTickets,
  EventTicketsQuery,
  EventTicketsQueryVariables,
} from "./eventTickets.generated";

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

describe("Should get events and its tickets", () => {
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
      EventTicketsQuery,
      EventTicketsQueryVariables
    >(
      {
        document: EventTickets,
        variables: {
          input: {},
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.searchEvents.data[0]?.tickets?.length, 1);

    assert.equal(
      response.data?.searchEvents.data[0]?.tickets[0]?.id,
      ticket.id,
    );
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
      EventTicketsQuery,
      EventTicketsQueryVariables
    >({
      document: EventTickets,
      variables: {
        input: {},
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.searchEvents.data[0]?.tickets?.length, 1);

    assert.equal(
      response.data?.searchEvents.data[0]?.tickets[0]?.id,
      ticket.id,
    );
  });
});
