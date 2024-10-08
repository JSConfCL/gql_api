import { addDays, differenceInSeconds, endOfDay } from "date-fns";
import { AsyncReturnType } from "type-fest";
import { v4 } from "uuid";
import { assert, describe, it, expect } from "vitest";

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
  insertUserToCommunity,
  insertTicket,
} from "~/tests/fixtures";
import { getTestDB } from "~/tests/fixtures/databaseHelper";

import {
  GiftMyTicketToUser,
  GiftMyTicketToUserMutation,
  GiftMyTicketToUserMutationVariables,
} from "./giftMyTicketToUser.generated";
import { getExpirationDateForGift } from "../../helpers";

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

describe("Gift My Ticket To User", () => {
  describe("Successful gifting scenarios", () => {
    it("Should successfully gift a ticket to an existing user", async () => {
      const { user, userTicket } = await createTestSetup();
      const recipientUser = await insertUser();

      const response = await executeGraphqlOperationAsUser<
        GiftMyTicketToUserMutation,
        GiftMyTicketToUserMutationVariables
      >(
        {
          document: GiftMyTicketToUser,
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

      assert.equal(response.data?.giftMyTicketToUser.status, "Pending");

      assert.equal(response.data?.giftMyTicketToUser.gifter.email, user.email);

      assert.equal(
        response.data?.giftMyTicketToUser.recipient.email,
        recipientUser.email,
      );

      // Verify database changes
      const DB = await getTestDB();
      const updatedUserTicket = await DB.query.userTicketsSchema.findFirst({
        where: (t, { eq }) => eq(t.id, userTicket.id),
      });

      assert.equal(updatedUserTicket?.approvalStatus, "gifted");

      assert.equal(updatedUserTicket?.userId, recipientUser.id);
    });

    it("Should successfully gift a ticket to a non-existent user (creating a new user)", async () => {
      const { user, userTicket } = await createTestSetup();
      const newEmail = "newuser@example.com";
      const newName = "New User";

      const response = await executeGraphqlOperationAsUser<
        GiftMyTicketToUserMutation,
        GiftMyTicketToUserMutationVariables
      >(
        {
          document: GiftMyTicketToUser,
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

      assert.equal(response.data?.giftMyTicketToUser.status, "Pending");

      assert.equal(response.data?.giftMyTicketToUser.gifter.email, user.email);

      assert.equal(response.data?.giftMyTicketToUser.recipient.email, newEmail);

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

      assert.equal(updatedUserTicket?.approvalStatus, "gifted");

      assert.equal(updatedUserTicket?.userId, newUser?.id);
    });

    it("Should handle gifting without a message", async () => {
      const { user, userTicket } = await createTestSetup();
      const recipientUser = await insertUser();

      const response = await executeGraphqlOperationAsUser<
        GiftMyTicketToUserMutation,
        GiftMyTicketToUserMutationVariables
      >(
        {
          document: GiftMyTicketToUser,
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

      assert.equal(response.data?.giftMyTicketToUser.status, "Pending");

      assert.equal(response.data?.giftMyTicketToUser.giftMessage, null);
    });
  });

  describe("Error handling scenarios", () => {
    it("Should throw an error when gifting a non-existent ticket", async () => {
      const { user } = await createTestSetup();
      const recipientUser = await insertUser();

      const response = await executeGraphqlOperationAsUser<
        GiftMyTicketToUserMutation,
        GiftMyTicketToUserMutationVariables
      >(
        {
          document: GiftMyTicketToUser,
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

    it("Should throw an error when gifting a ticket with invalid approval status", async () => {
      const { user } = await createTestSetup();
      const recipientUser = await insertUser();
      const invalidTicket = await insertTicket({
        userId: user.id,
        ticketTemplateId: (await insertTicketTemplate()).id,
        approvalStatus: "rejected",
      });

      const response = await executeGraphqlOperationAsUser<
        GiftMyTicketToUserMutation,
        GiftMyTicketToUserMutationVariables
      >(
        {
          document: GiftMyTicketToUser,
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

      assert.equal(response.errors?.[0].message, "Ticket is not giftable");

      // Verify that the ticket status hasn't changed
      const DB = await getTestDB();
      const unchangedTicket = await DB.query.userTicketsSchema.findFirst({
        where: (t, { eq }) => eq(t.id, invalidTicket.id),
      });

      assert.equal(unchangedTicket?.approvalStatus, "rejected");
    });
  });

  describe("Edge cases", () => {
    it("Should handle multiple gift attempts for the same ticket", async () => {
      const { user, userTicket } = await createTestSetup();
      const recipientUser1 = await insertUser();
      const recipientUser2 = await insertUser();

      const response1 = await executeGraphqlOperationAsUser<
        GiftMyTicketToUserMutation,
        GiftMyTicketToUserMutationVariables
      >(
        {
          document: GiftMyTicketToUser,
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

      assert.equal(response1.data?.giftMyTicketToUser.status, "Pending");

      // Attempt to gift the same ticket again
      const response = await executeGraphqlOperationAsUser<
        GiftMyTicketToUserMutation,
        GiftMyTicketToUserMutationVariables
      >(
        {
          document: GiftMyTicketToUser,
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

      assert.equal(response.errors?.[0].message, "Ticket not found");

      // Verify that the ticket is still associated with the first recipient
      const DB = await getTestDB();
      const updatedUserTicket = await DB.query.userTicketsSchema.findFirst({
        where: (t, { eq }) => eq(t.id, userTicket.id),
      });

      assert.equal(updatedUserTicket?.userId, recipientUser1.id);
    });

    it("Should verify the expiration date is set correctly", async () => {
      const { user, userTicket } = await createTestSetup();
      const recipientUser = await insertUser();

      const response = await executeGraphqlOperationAsUser<
        GiftMyTicketToUserMutation,
        GiftMyTicketToUserMutationVariables
      >(
        {
          document: GiftMyTicketToUser,
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

      const expectedExpirationDate = getExpirationDateForGift();
      const actualExpirationDate = new Date(
        response.data?.giftMyTicketToUser.expirationDate ?? "",
      );

      const diffInSeconds = differenceInSeconds(
        actualExpirationDate,
        expectedExpirationDate,
      );

      assert.isBelow(diffInSeconds, 5);
    });
  });
});