import { assert, describe, it } from "vitest";

import {
  executeGraphqlOperationAsSuperAdmin,
  insertEvent,
  insertTicketTemplate,
  insertUser,
} from "~/tests/fixtures";

import {
  GiftTicketsToUsers,
  GiftTicketsToUsersMutation,
  GiftTicketsToUsersMutationVariables,
} from "./giftTicketsToUsers.generated";

describe("Should send tickets to users in bulk", () => {
  it("as a superadmin", async () => {
    const user1 = await insertUser();
    const user2 = await insertUser();
    const event1 = await insertEvent();
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
    });

    const response = await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: false,
          ticketIds: [ticket.id],
          userIds: [user1.id, user2.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.giftTicketsToUsers.length, 2);
  });

  it("Only for a users that don't have tickets (if we don't allow MultipleTicketsPerUsers)", async () => {
    const user1 = await insertUser();
    const user2 = await insertUser();
    const event1 = await insertEvent();
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
    });

    await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: false,
          ticketIds: [ticket.id],
          userIds: [user1.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    const response = await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: false,
          ticketIds: [ticket.id],
          userIds: [user1.id, user2.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.giftTicketsToUsers.length, 1);
  });

  it("should allow multiple tickets per user when allowMultipleTicketsPerUsers is true", async () => {
    const user1 = await insertUser();
    const user2 = await insertUser();
    const event1 = await insertEvent();
    const ticket1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const ticket2 = await insertTicketTemplate({
      eventId: event1.id,
    });

    // First, gift a ticket to user1 and user2
    await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: false,
          ticketIds: [ticket1.id],
          userIds: [user1.id, user2.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    // Now, attempt to gift another ticket to the same users with allowMultipleTicketsPerUsers set to true
    const response = await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: true,
          ticketIds: [ticket2.id],
          userIds: [user1.id, user2.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.giftTicketsToUsers.length, 2);
  });
});

describe("Should fail send tickets to users in bulk", () => {
  it("if no users are passed", async () => {
    const event1 = await insertEvent();
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
    });

    const response = await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: false,
          ticketIds: [ticket.id],
          userIds: [],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    assert.equal(response.errors?.[0].message, "No users provided");
  });

  it("if we try to send tickets to users that already have with allowMultipleTicketsPerUsers:false", async () => {
    const event1 = await insertEvent();
    const user1 = await insertUser();
    const user2 = await insertUser();
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
    });

    await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: false,
          ticketIds: [ticket.id],
          userIds: [user1.id, user2.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });
    const response = await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: false,
          ticketIds: [ticket.id],
          userIds: [user1.id, user2.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    assert.equal(
      response.errors?.[0].message,
      "All provided users already have tickets",
    );
  });
});

describe("Multiple tickets per user scenarios", () => {
  it("should allow gifting same ticket template multiple times when allowMultipleTicketsPerUsers is true", async () => {
    const user1 = await insertUser();
    const event1 = await insertEvent();
    const ticket1 = await insertTicketTemplate({
      eventId: event1.id,
    });

    // Gift first ticket
    await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: true,
          ticketIds: [ticket1.id],
          userIds: [user1.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    // Gift second ticket of same template
    const response = await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: true,
          ticketIds: [ticket1.id],
          userIds: [user1.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.giftTicketsToUsers.length, 1);
  });

  it("should allow gifting multiple different ticket templates simultaneously", async () => {
    const user1 = await insertUser();
    const event1 = await insertEvent();
    const ticket1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const ticket2 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const ticket3 = await insertTicketTemplate({
      eventId: event1.id,
    });

    const response = await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: true,
          ticketIds: [ticket1.id, ticket2.id, ticket3.id],
          userIds: [user1.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.giftTicketsToUsers.length, 3);
  });

  it("should handle mixed scenarios of users with and without existing tickets", async () => {
    const user1 = await insertUser();
    const user2 = await insertUser();
    const user3 = await insertUser();
    const event1 = await insertEvent();
    const ticket1 = await insertTicketTemplate({
      eventId: event1.id,
    });

    // First gift to user1 only
    await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: false,
          ticketIds: [ticket1.id],
          userIds: [user1.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    // Now gift to all users with allowMultipleTicketsPerUsers true
    const response = await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: true,
          ticketIds: [ticket1.id],
          userIds: [user1.id, user2.id, user3.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.giftTicketsToUsers.length, 3);
  });

  it("should verify ticket approval status is set correctly", async () => {
    const user1 = await insertUser();
    const event1 = await insertEvent();
    const ticket1 = await insertTicketTemplate({
      eventId: event1.id,
    });

    const response = await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: true,
          ticketIds: [ticket1.id],
          userIds: [user1.id],
          notifyUsers: false,
          autoApproveTickets: true, // Testing with autoApprove
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(
      response.data?.giftTicketsToUsers[0].approvalStatus,
      "approved",
    );
  });

  it("should handle multiple tickets across different events", async () => {
    const user1 = await insertUser();
    const event1 = await insertEvent();
    const event2 = await insertEvent();

    const ticket1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const ticket2 = await insertTicketTemplate({
      eventId: event2.id,
    });

    const response = await executeGraphqlOperationAsSuperAdmin<
      GiftTicketsToUsersMutation,
      GiftTicketsToUsersMutationVariables
    >({
      document: GiftTicketsToUsers,
      variables: {
        input: {
          allowMultipleTicketsPerUsers: true,
          ticketIds: [ticket1.id, ticket2.id],
          userIds: [user1.id],
          notifyUsers: false,
          autoApproveTickets: false,
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.giftTicketsToUsers.length, 2);

    // Verify tickets are for different events
    const ticketEvents = new Set(
      response.data?.giftTicketsToUsers.map(
        (ticket) => ticket.ticketTemplate.event.id,
      ),
    );

    assert.equal(ticketEvents.size, 2);
  });
});
