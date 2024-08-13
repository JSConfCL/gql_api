import { faker } from "@faker-js/faker";
import { AsyncReturnType } from "type-fest";
import { it, describe, assert } from "vitest";

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
} from "~/tests/fixtures";

import {
  ClaimUserTicket,
  ClaimUserTicketMutation,
  ClaimUserTicketMutationVariables,
} from "./claimUserTicket.generated";

const createCommunityEventUserAndTicketTemplate = async ({
  community,
  event,
  user,
  ticketTemplate,
  ticketPrice,
}: {
  community?: AsyncReturnType<typeof insertCommunity>;
  event?: AsyncReturnType<typeof insertEvent>;
  user?: AsyncReturnType<typeof insertUser>;
  ticketTemplate?: AsyncReturnType<typeof insertTicketTemplate>;
  ticketPrice?: AsyncReturnType<typeof insertPrice>;
} = {}) => {
  const createdCommunity = community ?? (await insertCommunity());
  const createdEvent =
    event ??
    (await insertEvent({
      status: "active",
    }));

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

  return {
    community: createdCommunity,
    event: createdEvent,
    user: createdUser,
    ticketTemplate: createdTicketTemplate,
    ticketPrice: createdTicketPrice,
  };
};

describe("Claim a user ticket", () => {
  describe("Should allow claiming", () => {
    it("For a MEMBER user", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });
      const response = await executeGraphqlOperationAsUser<
        ClaimUserTicketMutation,
        ClaimUserTicketMutationVariables
      >(
        {
          document: ClaimUserTicket,
          variables: {
            input: {
              purchaseOrder: [
                {
                  ticketId: ticketTemplate.id,
                  quantity: 2,
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                },
              ],
            },
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.claimUserTicket?.__typename, "PurchaseOrder");

      if (response.data?.claimUserTicket?.__typename === "PurchaseOrder") {
        assert.equal(response.data?.claimUserTicket.tickets.length, 3);
      }
    });

    it("For an ADMIN user", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "admin",
      });
      const response = await executeGraphqlOperationAsUser<
        ClaimUserTicketMutation,
        ClaimUserTicketMutationVariables
      >(
        {
          document: ClaimUserTicket,
          variables: {
            input: {
              purchaseOrder: [
                {
                  ticketId: ticketTemplate.id,
                  quantity: 2,
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                },
              ],
            },
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.claimUserTicket?.__typename, "PurchaseOrder");

      if (response.data?.claimUserTicket?.__typename === "PurchaseOrder") {
        assert.equal(response.data?.claimUserTicket.tickets.length, 3);
      }
    });

    it("For a COLLABORATOR  user", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "collaborator",
      });
      const response = await executeGraphqlOperationAsUser<
        ClaimUserTicketMutation,
        ClaimUserTicketMutationVariables
      >(
        {
          document: ClaimUserTicket,
          variables: {
            input: {
              purchaseOrder: [
                {
                  ticketId: ticketTemplate.id,
                  quantity: 2,
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                },
              ],
            },
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.claimUserTicket?.__typename, "PurchaseOrder");

      if (response.data?.claimUserTicket?.__typename === "PurchaseOrder") {
        assert.equal(response.data?.claimUserTicket.tickets.length, 3);
      }
    });

    it("For a SUPER ADMIN user", async () => {
      const createdUser = await insertUser({
        isSuperAdmin: true,
      });
      const { user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          user: createdUser,
        });

      const response = await executeGraphqlOperationAsUser<
        ClaimUserTicketMutation,
        ClaimUserTicketMutationVariables
      >(
        {
          document: ClaimUserTicket,
          variables: {
            input: {
              purchaseOrder: [
                {
                  ticketId: ticketTemplate.id,
                  quantity: 2,
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                },
              ],
            },
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.claimUserTicket?.__typename, "PurchaseOrder");

      if (response.data?.claimUserTicket?.__typename === "PurchaseOrder") {
        assert.equal(response.data?.claimUserTicket.tickets.length, 3);
      }
    });
  });

  describe("Should NOT allow claiming", () => {
    it("If the event is Inactive", async () => {
      const createdEvent = await insertEvent({
        status: "inactive",
      });
      const { community, user, ticketTemplate, event } =
        await createCommunityEventUserAndTicketTemplate({
          event: createdEvent,
        });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });
      const response = await executeGraphqlOperationAsUser<
        ClaimUserTicketMutation,
        ClaimUserTicketMutationVariables
      >(
        {
          document: ClaimUserTicket,
          variables: {
            input: {
              purchaseOrder: [
                {
                  ticketId: ticketTemplate.id,
                  quantity: 2,
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                },
              ],
            },
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(
        response.data?.claimUserTicket?.__typename,
        "RedeemUserTicketError",
      );

      if (
        response.data?.claimUserTicket?.__typename === "RedeemUserTicketError"
      ) {
        assert.equal(
          response.data?.claimUserTicket.errorMessage,
          `Event ${event.id} is not active. Cannot claim tickets for an inactive event.`,
        );
      }
    });

    it("If we would be going over ticket quantity", async () => {
      const createdEvent = await insertEvent({
        status: "active",
      });
      const createdTicketTemplate = await insertTicketTemplate({
        eventId: createdEvent.id,
        quantity: 5,
      });
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          event: createdEvent,
          ticketTemplate: createdTicketTemplate,
        });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });
      const response = await executeGraphqlOperationAsUser<
        ClaimUserTicketMutation,
        ClaimUserTicketMutationVariables
      >(
        {
          document: ClaimUserTicket,
          variables: {
            input: {
              purchaseOrder: [
                {
                  ticketId: ticketTemplate.id,
                  quantity: 10,
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                },
              ],
            },
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(
        response.data?.claimUserTicket?.__typename,
        "RedeemUserTicketError",
      );

      if (
        response.data?.claimUserTicket?.__typename === "RedeemUserTicketError"
      ) {
        assert.equal(
          response.data?.claimUserTicket.errorMessage,
          `Not enough tickets for ticket template with id ${ticketTemplate.id}`,
        );
      }
    });
  });
});
