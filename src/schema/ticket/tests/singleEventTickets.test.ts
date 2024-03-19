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
  SingleEventTickets,
  SingleEventTicketsQuery,
  SingleEventTicketsQueryVariables,
} from "./singleEventTickets.generated";

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
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
    });
    const ticket2 = await insertTicketTemplate({
      eventId: event1.id,
    });

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
    assert.equal(response.data?.event?.tickets?.length, 2);
    assert.equal(response.data?.event?.tickets[0]?.id, ticket.id);
    assert.equal(response.data?.event?.tickets[1]?.id, ticket2.id); // assert.deepEqual(response.data?.editTicket, {
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
    const ticket2 = await insertTicketTemplate({
      eventId: event1.id,
    });

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
    assert.equal(response.data?.event?.tickets?.length, 2);
    assert.equal(response.data?.event?.tickets[0]?.id, ticket.id);
    assert.equal(response.data?.event?.tickets[1]?.id, ticket2.id);
  });
});
