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
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
    });

    const response = await executeGraphqlOperationAsUser<
      EventTicketsQuery,
      EventTicketsQueryVariables
    >(
      {
        document: EventTickets,
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.events[0]?.tickets?.length, 1);
    assert.equal(response.data?.events[0]?.tickets[0]?.id, ticket.id);
  });
  it("as an anonymous query", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
    });

    const response = await executeGraphqlOperation<
      EventTicketsQuery,
      EventTicketsQueryVariables
    >({
      document: EventTickets,
    });

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.events[0]?.tickets?.length, 1);
    assert.equal(response.data?.events[0]?.tickets[0]?.id, ticket.id);
  });
});