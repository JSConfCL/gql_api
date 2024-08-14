import { describe, assert, it } from "vitest";

import {
  FetchWaitlist,
  FetchWaitlistQuery,
  FetchWaitlistQueryVariables,
} from "~/schema/waitlist/tests/fetchWaitlist.generated";
import {
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertPurchaseOrder,
  insertTicket,
  insertTicketTemplate,
  insertUser,
} from "~/tests/fixtures";

describe("Should get my ticket for a waitlist", () => {
  it("as a User", async () => {
    const user1 = await insertUser({
      isSuperAdmin: false,
    });
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
      tags: ["waitlist"],
    });
    const purchaseOrder = await insertPurchaseOrder({
      userId: user1.id,
    });
    const userTicket = await insertTicket({
      ticketTemplateId: ticket.id,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: "pending",
    });

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });

    const response = await executeGraphqlOperationAsUser<
      FetchWaitlistQuery,
      FetchWaitlistQueryVariables
    >(
      {
        document: FetchWaitlist,
        variables: {
          ticketId: ticket.id,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.getWaitlist.id, ticket.id);

    assert.equal(response.data?.getWaitlist.myRsvp?.id, userTicket.id);
  });
});
