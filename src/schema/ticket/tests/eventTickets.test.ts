import { faker } from "@faker-js/faker";
import { it, describe, assert } from "vitest";

import {
  TicketTemplateStatus,
  TicketTemplateVisibility,
} from "~/generated/types";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertTicketTemplate,
  insertUser,
  insertUserToCommunity,
  toISODateWithoutMilliseconds,
} from "~/tests/fixtures";

import {
  EditTicket,
  EditTicketMutation,
  EditTicketMutationVariables,
} from "./editTicket.generated";
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
    const ticket2 = await insertTicketTemplate({
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
    assert.equal(response.data?.events[0]?.tickets?.length, 2);
    assert.equal(response.data?.events[0]?.tickets[0]?.id, ticket.id);
    assert.equal(response.data?.events[0]?.tickets[1]?.id, ticket2.id); // assert.deepEqual(response.data?.editTicket, {
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
      EventTicketsQuery,
      EventTicketsQueryVariables
    >({
      document: EventTickets,
    });

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.events[0]?.tickets?.length, 2);
    assert.equal(response.data?.events[0]?.tickets[0]?.id, ticket.id);
    assert.equal(response.data?.events[0]?.tickets[1]?.id, ticket2.id);
  });
});
