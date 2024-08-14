import { describe, assert, it, vitest } from "vitest";

import {
  ApplyToWaitlist,
  ApplyToWaitlistMutation,
  ApplyToWaitlistMutationVariables,
} from "~/schema/waitlist/tests/createWaitlist.generated";
import {
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertTicketTemplate,
  insertUser,
} from "~/tests/fixtures";

describe("Should reserve a ticket for a waitlist", () => {
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

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });

    const response = await executeGraphqlOperationAsUser<
      ApplyToWaitlistMutation,
      ApplyToWaitlistMutationVariables
    >(
      {
        document: ApplyToWaitlist,
        variables: {
          ticketId: ticket.id,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);

    assert.exists(response.data?.applyToWaitlist.id);

    assert.equal(response.data?.applyToWaitlist.approvalStatus, "pending");

    assert.equal(response.data?.applyToWaitlist?.ticketTemplate?.id, ticket.id);
  });
});

describe("Should fail to reserve a ticket for a waitlist", () => {
  it("If user has tickets already", async () => {
    const user1 = await insertUser({
      isSuperAdmin: false,
    });
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
      tags: ["waitlist"],
    });

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });

    const response = await executeGraphqlOperationAsUser<
      ApplyToWaitlistMutation,
      ApplyToWaitlistMutationVariables
    >(
      {
        document: ApplyToWaitlist,
        variables: {
          ticketId: ticket.id,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);

    const secondResponse = await executeGraphqlOperationAsUser<
      ApplyToWaitlistMutation,
      ApplyToWaitlistMutationVariables
    >(
      {
        document: ApplyToWaitlist,
        variables: {
          ticketId: ticket.id,
        },
      },
      user1,
    );

    assert.equal(
      secondResponse.errors?.[0]?.message,
      "User already applied to waitlist",
    );
  });
});
