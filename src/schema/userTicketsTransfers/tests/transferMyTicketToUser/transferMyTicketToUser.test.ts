import { differenceInSeconds } from "date-fns";
import { AsyncReturnType } from "type-fest";
import { assert, describe, it } from "vitest";

import { UserTicketTransferStatus } from "~/datasources/db/userTicketsTransfers";
import {
  executeGraphqlOperationAsUser,
  insertAllowedCurrency,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertPrice,
  insertTicketPrice,
  insertTicketTemplate,
  insertUser,
  insertTicket,
} from "~/tests/fixtures";
import { getTestDB } from "~/tests/fixtures/databaseHelper";

import {
  TransferMyTicketToUser,
  TransferMyTicketToUserMutation,
  TransferMyTicketToUserMutationVariables,
} from "./transferMyTicketToUser.generated";
import { getExpirationDateForTicketTransfer } from "../../helpers";

const createTestSetup = async ({
  community,
  event,
  user,
  ticketTemplate,
  ticketPrice,
  userTicket,
}: {
  community?: AsyncReturnType<typeof insertCommunity>;
  event?: AsyncReturnType<typeof insertEvent>;
  user?: AsyncReturnType<typeof insertUser>;
  ticketTemplate?: AsyncReturnType<typeof insertTicketTemplate>;
  ticketPrice?: AsyncReturnType<typeof insertPrice>;
  userTicket?: AsyncReturnType<typeof insertTicket>;
} = {}) => {
  const createdCommunity = community ?? (await insertCommunity());
  const createdEvent = event ?? (await insertEvent({ status: "active" }));

  await insertEventToCommunity({
    eventId: createdEvent.id,
    communityId: createdCommunity.id,
  });

  const createdUser = user ?? (await insertUser());

  const createdTicketTemplate =
    ticketTemplate ??
    (await insertTicketTemplate({
      eventId: createdEvent.id,
      quantity: 100,
      isFree: false,
      isUnlimited: false,
    }));

  const allowedCurrency = await insertAllowedCurrency({
    currency: "USD",
    validPaymentMethods: "stripe",
  });

  const price = await insertPrice({
    price_in_cents: 100_00,
    currencyId: allowedCurrency.id,
  });

  const createdTicketPrice =
    ticketPrice ??
    (await insertTicketPrice({
      priceId: price.id,
      ticketId: createdTicketTemplate.id,
    }));

  const createdUserTicket =
    userTicket ??
    (await insertTicket({
      userId: createdUser.id,
      ticketTemplateId: createdTicketTemplate.id,
      approvalStatus: "approved",
    }));

  return {
    community: createdCommunity,
    event: createdEvent,
    user: createdUser,
    ticketTemplate: createdTicketTemplate,
    ticketPrice: createdTicketPrice,
    userTicket: createdUserTicket,
  };
};

describe("Transfer My Ticket To User", () => {
  describe("Successful transfer scenarios", () => {
    it("Should successfully transfer a ticket to an existing user", async () => {
      const { user, userTicket } = await createTestSetup();
      const recipientUser = await insertUser();

      const response = await executeGraphqlOperationAsUser<
        TransferMyTicketToUserMutation,
        TransferMyTicketToUserMutationVariables
      >(
        {
          document: TransferMyTicketToUser,
          variables: {
            ticketId: userTicket.id,
            input: {
              email: recipientUser.email,
              name: "John Doe",
              message: "Enjoy the event!",
            },
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.transferMyTicketToUser.status, "Pending");

      assert.equal(
        response.data?.transferMyTicketToUser.sender.email,
        user.email,
      );

      assert.equal(
        response.data?.transferMyTicketToUser.recipient.email,
        recipientUser.email,
      );

      // Verify database changes
      const DB = await getTestDB();
      const updatedUserTicket = await DB.query.userTicketsSchema.findFirst({
        where: (t, { eq }) => eq(t.id, userTicket.id),
      });

      assert.equal(updatedUserTicket?.approvalStatus, "transfer_pending");

      // The ticket should still belong to the original user
      assert.equal(updatedUserTicket?.userId, user.id);
    });

    it("Should successfully transfer a ticket to a non-existent user (creating a new user)", async () => {
      const { user, userTicket } = await createTestSetup();
      const newEmail = "newuser@example.com";
      const newName = "New User";

      const response = await executeGraphqlOperationAsUser<
        TransferMyTicketToUserMutation,
        TransferMyTicketToUserMutationVariables
      >(
        {
          document: TransferMyTicketToUser,
          variables: {
            ticketId: userTicket.id,
            input: {
              email: newEmail,
              name: newName,
            },
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.transferMyTicketToUser.status, "Pending");

      assert.equal(
        response.data?.transferMyTicketToUser.sender.email,
        user.email,
      );

      assert.equal(
        response.data?.transferMyTicketToUser.recipient.email,
        newEmail,
      );

      // Verify new user creation and database changes
      const DB = await getTestDB();
      const newUser = await DB.query.usersSchema.findFirst({
        where: (u, { eq }) => eq(u.email, newEmail),
      });

      assert.notEqual(newUser, null);

      assert.equal(newUser?.name, newName);

      const updatedUserTicket = await DB.query.userTicketsSchema.findFirst({
        where: (t, { eq }) => eq(t.id, userTicket.id),
      });

      assert.equal(updatedUserTicket?.approvalStatus, "transfer_pending");

      // The ticket should still belong to the original user
      assert.equal(updatedUserTicket?.userId, user?.id);
    });

    it("Should handle transfer without a message", async () => {
      const { user, userTicket } = await createTestSetup();
      const recipientUser = await insertUser();

      const response = await executeGraphqlOperationAsUser<
        TransferMyTicketToUserMutation,
        TransferMyTicketToUserMutationVariables
      >(
        {
          document: TransferMyTicketToUser,
          variables: {
            ticketId: userTicket.id,
            input: {
              email: recipientUser.email,
              name: "Jane Doe",
            },
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.transferMyTicketToUser.status, "Pending");

      assert.equal(response.data?.transferMyTicketToUser.transferMessage, null);
    });
  });

  describe("Error handling scenarios", () => {
    it("Should throw an error when transferring a non-existent ticket", async () => {
      const { user } = await createTestSetup();
      const recipientUser = await insertUser();

      const response = await executeGraphqlOperationAsUser<
        TransferMyTicketToUserMutation,
        TransferMyTicketToUserMutationVariables
      >(
        {
          document: TransferMyTicketToUser,
          variables: {
            ticketId: "00000000-0000-4000-8000-000000000000",
            input: {
              email: recipientUser.email,
              name: "John Doe",
            },
          },
        },
        user,
      );

      assert.equal(response.errors?.[0].message, "Ticket not found");
    });

    it("Should throw an error when transferring a ticket with invalid approval status", async () => {
      const { user } = await createTestSetup();
      const recipientUser = await insertUser();
      const invalidTicket = await insertTicket({
        userId: user.id,
        ticketTemplateId: (await insertTicketTemplate()).id,
        approvalStatus: "rejected",
      });

      const response = await executeGraphqlOperationAsUser<
        TransferMyTicketToUserMutation,
        TransferMyTicketToUserMutationVariables
      >(
        {
          document: TransferMyTicketToUser,
          variables: {
            ticketId: invalidTicket.id,
            input: {
              email: recipientUser.email,
              name: "John Doe",
            },
          },
        },
        user,
      );

      assert.equal(response.errors?.[0].message, "Ticket is not transferable");

      // Verify that the ticket status hasn't changed
      const DB = await getTestDB();
      const unchangedTicket = await DB.query.userTicketsSchema.findFirst({
        where: (t, { eq }) => eq(t.id, invalidTicket.id),
      });

      assert.equal(unchangedTicket?.approvalStatus, "rejected");
    });
  });

  describe("Edge cases", () => {
    it("Should verify the expiration date is set correctly", async () => {
      const { user, userTicket } = await createTestSetup();
      const recipientUser = await insertUser();

      const response = await executeGraphqlOperationAsUser<
        TransferMyTicketToUserMutation,
        TransferMyTicketToUserMutationVariables
      >(
        {
          document: TransferMyTicketToUser,
          variables: {
            ticketId: userTicket.id,
            input: {
              email: recipientUser.email,
              name: "John Doe",
            },
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      const expectedExpirationDate = getExpirationDateForTicketTransfer();
      const actualExpirationDate = new Date(
        response.data?.transferMyTicketToUser.expirationDate ?? "",
      );

      const diffInSeconds = differenceInSeconds(
        actualExpirationDate,
        expectedExpirationDate,
      );

      assert.isBelow(diffInSeconds, 5);
    });

    it("Should throw an error when transferring a ticket to yourself", async () => {
      const { user, userTicket } = await createTestSetup();

      const response = await executeGraphqlOperationAsUser<
        TransferMyTicketToUserMutation,
        TransferMyTicketToUserMutationVariables
      >(
        {
          document: TransferMyTicketToUser,
          variables: {
            ticketId: userTicket.id,
            input: {
              email: user.email,
              name: "John Doe",
            },
          },
        },
        user,
      );

      assert.equal(
        response.errors?.[0].message,
        "You cannot transfer a ticket to yourself",
      );
    });

    it("Should cancel existing pending transfers and create a new one without changing the ticket owner", async () => {
      const { user, userTicket } = await createTestSetup();
      const recipientUser1 = await insertUser();
      const recipientUser2 = await insertUser();

      // First transfer
      await executeGraphqlOperationAsUser<
        TransferMyTicketToUserMutation,
        TransferMyTicketToUserMutationVariables
      >(
        {
          document: TransferMyTicketToUser,
          variables: {
            ticketId: userTicket.id,
            input: {
              email: recipientUser1.email,
              name: "Recipient 1",
            },
          },
        },
        user,
      );

      // Second transfer
      const response2 = await executeGraphqlOperationAsUser<
        TransferMyTicketToUserMutation,
        TransferMyTicketToUserMutationVariables
      >(
        {
          document: TransferMyTicketToUser,
          variables: {
            ticketId: userTicket.id,
            input: {
              email: recipientUser2.email,
              name: "Recipient 2",
            },
          },
        },
        user,
      );

      assert.equal(response2.errors, undefined);

      assert.equal(response2.data?.transferMyTicketToUser.status, "Pending");

      const DB = await getTestDB();

      // Verify that the ticket's approval status is 'transfer_pending' but the owner hasn't changed
      const updatedUserTicket = await DB.query.userTicketsSchema.findFirst({
        where: (t, { eq }) => eq(t.id, userTicket.id),
      });

      assert.equal(updatedUserTicket?.userId, user.id); // The ticket should still belong to the original user

      assert.equal(updatedUserTicket?.approvalStatus, "transfer_pending");

      // Verify that the first transfer was cancelled
      const cancelledTransfer =
        await DB.query.userTicketTransfersSchema.findFirst({
          where: (t, { eq, and }) =>
            and(
              eq(t.userTicketId, userTicket.id),
              eq(t.recipientUserId, recipientUser1.id),
            ),
        });

      assert.equal(
        cancelledTransfer?.status,
        UserTicketTransferStatus.Cancelled,
      );

      // Verify that a new pending transfer exists for the second recipient
      const pendingTransfer =
        await DB.query.userTicketTransfersSchema.findFirst({
          where: (t, { eq, and }) =>
            and(
              eq(t.userTicketId, userTicket.id),
              eq(t.recipientUserId, recipientUser2.id),
              eq(t.status, UserTicketTransferStatus.Pending),
            ),
        });

      assert.notEqual(pendingTransfer, null);

      assert.equal(pendingTransfer?.senderUserId, user.id);
    });
  });
});
