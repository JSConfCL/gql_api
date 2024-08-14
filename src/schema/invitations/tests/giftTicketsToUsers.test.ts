import { describe, assert, it, vitest } from "vitest";

import {
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
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
          allowMultipleTicketsPerUsers: true,
          ticketId: ticket.id,
          userIds: [user1.id, user2.id],
          notifyUsers: false,
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
          allowMultipleTicketsPerUsers: true,
          ticketId: ticket.id,
          userIds: [user1.id],
          notifyUsers: false,
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
          ticketId: ticket.id,
          userIds: [user1.id, user2.id],
          notifyUsers: false,
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
          allowMultipleTicketsPerUsers: true,
          ticketId: ticket.id,
          userIds: [],
          notifyUsers: false,
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
          ticketId: ticket.id,
          userIds: [user1.id, user2.id],
          notifyUsers: false,
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
          ticketId: ticket.id,
          userIds: [user1.id, user2.id],
          notifyUsers: false,
        },
      },
    });

    assert.equal(
      response.errors?.[0].message,
      "All provided users already have tickets",
    );
  });
});

// describe("Should fail to reserve a ticket for a waitlist", () => {
//   it("If user has tickets already", async () => {
//     const user1 = await insertUser({
//       isSuperAdmin: false,
//     });
//     const community1 = await insertCommunity();
//     const event1 = await insertEvent();
//     const ticket = await insertTicketTemplate({
//       eventId: event1.id,
//       tags: ["waitlist"],
//     });

//     await insertEventToCommunity({
//       eventId: event1.id,
//       communityId: community1.id,
//     });

//     const response = await executeGraphqlOperationAsUser<
//       ApplyToWaitlistMutation,
//       ApplyToWaitlistMutationVariables
//     >(
//       {
//         document: ApplyToWaitlist,
//         variables: {
//           ticketId: ticket.id,
//         },
//       },
//       user1,
//       mockedContext,
//     );

//     assert.equal(response.errors, undefined);

//     const secondResponse = await executeGraphqlOperationAsUser<
//       ApplyToWaitlistMutation,
//       ApplyToWaitlistMutationVariables
//     >(
//       {
//         document: ApplyToWaitlist,
//         variables: {
//           ticketId: ticket.id,
//         },
//       },
//       user1,
//       mockedContext,
//     );

//     assert.equal(
//       secondResponse.errors?.[0]?.message,
//       "User already applied to waitlist",
//     );
//   });
// });
