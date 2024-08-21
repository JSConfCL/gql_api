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
