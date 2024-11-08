import { assert, describe, it, vi, expect, beforeEach } from "vitest";

import { InsertEventSchema } from "~/datasources/db/events";
import { AddonConstraintType } from "~/datasources/db/ticketAddons";
import { InsertTicketSchema } from "~/datasources/db/tickets";
import { InsertUserSchema, USER } from "~/datasources/db/users";
import { handlePaymentLinkGeneration } from "~/schema/purchaseOrder/actions";
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
  insertAddon,
  insertAddonConstraint,
  insertTicketAddon,
  insertAddonPrice,
  SAMPLE_TEST_UUID,
} from "~/tests/fixtures";

import {
  ClaimUserTicket,
  ClaimUserTicketMutation,
  ClaimUserTicketMutationVariables,
} from "./claimUserTicket.generated";

const createCommunityEventUserAndTicketTemplate = async ({
  ticketTemplate,
  user,
  event,
}: {
  ticketTemplate?: Partial<InsertTicketSchema>;
  user?: Partial<InsertUserSchema>;
  event?: Partial<InsertEventSchema>;
} = {}) => {
  const createdCommunity = await insertCommunity();
  const createdEvent = await insertEvent({
    ...event,
  });

  await insertEventToCommunity({
    eventId: createdEvent.id,
    communityId: createdCommunity.id,
  });
  const createdUser = await insertUser({
    ...user,
  });

  const createdTicketTemplate = await insertTicketTemplate({
    eventId: createdEvent.id,
    quantity: 100,
    isFree: false,
    isUnlimited: false,
    ...ticketTemplate,
  });

  const usdAllowedCurrency = await insertAllowedCurrency({
    currency: "USD",
    validPaymentMethods: "stripe",
  });
  const price = await insertPrice({
    price_in_cents: 100_00,
    currencyId: usdAllowedCurrency.id,
  });
  const createdTicketPrice = await insertTicketPrice({
    priceId: price.id,
    ticketId: createdTicketTemplate.id,
  });

  return {
    community: createdCommunity,
    event: createdEvent,
    user: createdUser,
    ticketTemplate: createdTicketTemplate,
    ticketPrice: createdTicketPrice,
    usdAllowedCurrency,
  };
};

const executeClaimTicket = async (
  user: USER,
  variables: ClaimUserTicketMutationVariables,
) => {
  return executeGraphqlOperationAsUser<
    ClaimUserTicketMutation,
    ClaimUserTicketMutationVariables
  >(
    {
      document: ClaimUserTicket,
      variables,
    },
    user,
  );
};

// Helper functions
const assertSuccessfulPurchase = ({
  response,
  expectedTicketsCount,
  message = "Should be a successful purchase",
}: {
  response: Awaited<ReturnType<typeof executeClaimTicket>>;
  expectedTicketsCount?: number;
  message?: string;
}) => {
  assert.equal(response.errors, undefined, `${message} - no errors`);

  assert.equal(
    response.data?.claimUserTicket?.__typename,
    "PurchaseOrder",
    `${message} - correct type`,
  );

  if (
    response.data?.claimUserTicket?.__typename === "PurchaseOrder" &&
    typeof expectedTicketsCount !== "undefined"
  ) {
    assert.equal(
      response.data.claimUserTicket.tickets.length,
      expectedTicketsCount,
      `${message} - correct ticket count`,
    );
  }

  if (response.data?.claimUserTicket?.__typename !== "PurchaseOrder") {
    throw new Error("Unexpected response type");
  }

  return response.data.claimUserTicket;
};

const assertPurchaseError = ({
  response,
  expectedError,
  message = "Should return expected error",
}: {
  response: Awaited<ReturnType<typeof executeClaimTicket>>;
  expectedError: string;
  message?: string;
}) => {
  assert.equal(response.errors, undefined, `${message} - no errors`);

  assert.equal(
    response.data?.claimUserTicket?.__typename,
    "RedeemUserTicketError",
    `${message} - error type`,
  );

  if (response.data?.claimUserTicket?.__typename === "RedeemUserTicketError") {
    assert.include(
      response.data.claimUserTicket.errorMessage,
      expectedError,
      `${message} - error message`,
    );
  }

  return response.data?.claimUserTicket;
};

// Mock the handlePaymentLinkGeneration function
vi.mock("~/schema/purchaseOrder/actions", () => ({
  handlePaymentLinkGeneration: vi.fn(),
}));

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

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 2,
              itemsDetails: [],
            },
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response,
        expectedTicketsCount: 3,
      });
    });

    it("For an ADMIN user", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "admin",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 2,
              itemsDetails: [],
            },
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response,
        expectedTicketsCount: 3,
      });
    });

    it("For a COLLABORATOR user", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "collaborator",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 2,
              itemsDetails: [],
            },
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response,
        expectedTicketsCount: 3,
      });
    });

    it("For a SUPER ADMIN user", async () => {
      const { user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          user: {
            isSuperAdmin: true,
          },
        });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 2,
              itemsDetails: [],
            },
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response,
        expectedTicketsCount: 3,
      });
    });
  });

  describe("Should handle quantity limits", () => {
    it("Should not allow claiming more tickets than the max per user", async () => {
      const maxTicketsPerUser = 2;

      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          ticketTemplate: {
            maxTicketsPerUser,
            quantity: 200,
          },
        });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });
      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 2,
              itemsDetails: [],
            },
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [],
            },
          ],
        },
      });

      assertPurchaseError({
        response,
        expectedError: `You cannot get more than ${maxTicketsPerUser} for ticket`,
      });
    });

    it("Should not allow claiming more tickets than available", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          ticketTemplate: {
            quantity: 5,
          },
        });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });
      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 10,
              itemsDetails: [],
            },
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [],
            },
          ],
        },
      });

      assertPurchaseError({
        response,
        expectedError: `We have gone over the limit of tickets for ticket template with id ${ticketTemplate.id}`,
      });
    });

    it("Should allow claiming up to the available quantity", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          ticketTemplate: {
            quantity: 5,
            isFree: true,
            isUnlimited: false,
            maxTicketsPerUser: 5,
          },
        });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 5,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response,
        expectedTicketsCount: 5,
      });
    });

    it("Should not count transferred tickets towards maxTicketsPerUser limit", async () => {
      const maxTicketsPerUser = 2;
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          ticketTemplate: {
            maxTicketsPerUser,
            quantity: 200,
          },
        });

      const transferRecipient = await insertUser();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      // First claim with transfer
      const response1 = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  transferInfo: {
                    name: "John Doe",
                    email: transferRecipient.email,
                    message: "Enjoy!",
                  },
                  addons: [],
                },
              ],
            },
          ],
        },
      });

      assert.equal(response1.errors, undefined);

      assert.equal(
        response1.data?.claimUserTicket?.__typename,
        "PurchaseOrder",
      );

      // Second claim for maxTicketsPerUser tickets - should succeed as transferred tickets don't count
      const response2 = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: maxTicketsPerUser,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response: response2,
        expectedTicketsCount: maxTicketsPerUser,
      });
    });
  });

  describe("Should handle transferring scenarios", () => {
    it("Should handle transferring to another user", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          ticketTemplate: {
            quantity: 10,
          },
        });
      const transferRecipient = await insertUser();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 2,
              itemsDetails: [
                {
                  transferInfo: {
                    name: "John Doe",
                    email: transferRecipient.email,
                    message: "Enjoy the event!",
                  },
                  addons: [],
                },
              ],
            },
          ],
        },
      });

      const purchaseOrder = assertSuccessfulPurchase({
        response,
        expectedTicketsCount: 2,
      });

      assert.equal(purchaseOrder.tickets[0].transferAttempts.length, 1);

      assert.equal(
        purchaseOrder.tickets[0].transferAttempts[0].recipient.email,
        transferRecipient.email,
      );
    });

    it("Should not allow transferring to self", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  transferInfo: {
                    name: "Para mi",
                    email: user.email,
                    message: "Self-transfer",
                  },
                  addons: [],
                },
              ],
            },
          ],
        },
      });

      assertPurchaseError({
        response,
        expectedError: "Cannot transfer to yourself",
      });
    });
  });

  describe("Should fail to create user tickets for a ticket in a waitlist state", () => {
    it("For a MEMBER user", async () => {
      const { user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          ticketTemplate: {
            tags: ["waitlist"],
          },
        });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 2,
              itemsDetails: [],
            },
          ],
        },
      });

      assertPurchaseError({
        response,
        expectedError: `Ticket ${ticketTemplate.id} is a waitlist ticket. Cannot claim waitlist tickets`,
      });
    });
  });

  describe("Should NOT allow claiming", () => {
    it("if the event is Inactive", async () => {
      const { community, user, ticketTemplate, event } =
        await createCommunityEventUserAndTicketTemplate({
          event: {
            status: "inactive",
          },
        });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });
      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 2,
              itemsDetails: [],
            },
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [],
            },
          ],
        },
      });

      assertPurchaseError({
        response,
        expectedError: `Event ${event.id} is not active. Cannot claim tickets for an inactive event.`,
      });
    });
  });

  describe("Payment link generation", () => {
    beforeEach(() => {
      // Reset all mocks before each test
      vi.resetAllMocks();
    });

    it("Should generate a payment link when requested", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      vi.mocked(handlePaymentLinkGeneration).mockResolvedValue({
        purchaseOrder: {
          id: SAMPLE_TEST_UUID,
          publicId: "some-public-id",
          userId: "some-user-id",
          idempotencyUUIDKey: "some-idempotency-key",
          totalPrice: "100",
          description: null,
          status: "open",
          createdAt: new Date(),
          updatedAt: null,
          deletedAt: null,
          currencyId: null,
          paymentPlatform: "stripe",
          paymentPlatformPaymentLink: "https://stripe.com/pay/123",
          purchaseOrderPaymentStatus: "not_required",
          paymentPlatformExpirationDate: null,
          paymentPlatformReferenceID: null,
          paymentPlatformStatus: null,
          paymentPlatformMetadata: null,
        },
        ticketsIds: [ticketTemplate.id],
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 2,
              itemsDetails: [],
            },
          ],
          generatePaymentLink: {
            currencyId: "some-currency-id",
          },
        },
      });

      const purchaseOrder = assertSuccessfulPurchase({
        response,
      });

      assert.equal(purchaseOrder.paymentLink, "https://stripe.com/pay/123");

      assert.equal(purchaseOrder.paymentPlatform, "stripe");

      expect(handlePaymentLinkGeneration).toHaveBeenCalled();
    });

    it("Should not generate a payment link when not requested", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 2,
              itemsDetails: [],
            },
          ],
        },
      });

      const purchaseOrder = assertSuccessfulPurchase({
        response,
      });

      assert.isNull(purchaseOrder.paymentLink);

      assert.isNull(purchaseOrder.paymentPlatform);

      expect(handlePaymentLinkGeneration).not.toHaveBeenCalled();
    });
  });

  describe("Addon handling", () => {
    it("Should allow claiming tickets with addons", async () => {
      const { community, user, ticketTemplate, event, usdAllowedCurrency } =
        await createCommunityEventUserAndTicketTemplate();

      const addon = await insertAddon({
        name: "Test Addon",
        description: "Test Addon Description",
        totalStock: 100,
        maxPerTicket: 2,
        isUnlimited: false,
        eventId: event.id,
      });

      await insertTicketAddon({
        ticketId: ticketTemplate.id,
        addonId: addon.id,
        orderDisplay: 1,
      });

      await insertAddonPrice({
        addonId: addon.id,
        priceId: (
          await insertPrice({
            price_in_cents: 100_00,
            currencyId: usdAllowedCurrency.id,
          })
        ).id,
      });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  addons: [
                    {
                      addonId: addon.id,
                      quantity: 2,
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      const purchaseOrder = assertSuccessfulPurchase({
        response,
        expectedTicketsCount: 1,
        message: "Should successfully claim tickets with addons",
      });

      assert.equal(purchaseOrder.tickets[0].userTicketAddons.length, 1);

      assert.equal(purchaseOrder.tickets[0].userTicketAddons[0].quantity, 2);

      assert.equal(
        purchaseOrder.tickets[0].userTicketAddons[0].addon.id,
        addon.id,
      );
    });

    it("Should not allow claiming more addons than maxPerTicket", async () => {
      const { community, user, ticketTemplate, event, usdAllowedCurrency } =
        await createCommunityEventUserAndTicketTemplate();

      const addon = await insertAddon({
        name: "Test Addon",
        description: "Test Addon Description",
        totalStock: 100,
        maxPerTicket: 2,
        isUnlimited: false,
        eventId: event.id,
      });

      await insertTicketAddon({
        ticketId: ticketTemplate.id,
        addonId: addon.id,
        orderDisplay: 1,
      });

      await insertAddonPrice({
        addonId: addon.id,
        priceId: (
          await insertPrice({
            price_in_cents: 100_00,
            currencyId: usdAllowedCurrency.id,
          })
        ).id,
      });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  addons: [
                    {
                      addonId: addon.id,
                      quantity: 3,
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      assertPurchaseError({
        response,
        expectedError: `total quantity exceeds limit per ticket for ticket`,
      });
    });

    it("Should not allow claiming addons that are not associated with the ticket", async () => {
      const { community, user, ticketTemplate, event, usdAllowedCurrency } =
        await createCommunityEventUserAndTicketTemplate();

      const addon = await insertAddon({
        name: "Test Addon",
        description: "Test Addon Description",
        totalStock: 100,
        maxPerTicket: 2,
        isUnlimited: false,
        eventId: event.id,
      });

      // Not associating the addon with the ticket
      await insertAddonPrice({
        addonId: addon.id,
        priceId: (
          await insertPrice({
            price_in_cents: 100_00,
            currencyId: usdAllowedCurrency.id,
          })
        ).id,
      });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  addons: [
                    {
                      addonId: addon.id,
                      quantity: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      assertPurchaseError({
        response,
        expectedError: `Addon ${addon.id} is not related to ticket ${ticketTemplate.id}`,
      });
    });

    it("Should handle addon constraints", async () => {
      const { community, user, ticketTemplate, event, usdAllowedCurrency } =
        await createCommunityEventUserAndTicketTemplate();

      const addon1 = await insertAddon({
        name: "Addon 1",
        description: "Addon 1 Description",
        totalStock: 100,
        maxPerTicket: 1,
        isUnlimited: false,
        eventId: event.id,
      });

      const addon2 = await insertAddon({
        name: "Addon 2",
        description: "Addon 2 Description",
        totalStock: 100,
        maxPerTicket: 1,
        isUnlimited: false,
        eventId: event.id,
      });

      await insertTicketAddon({
        ticketId: ticketTemplate.id,
        addonId: addon1.id,
        orderDisplay: 1,
      });

      await insertTicketAddon({
        ticketId: ticketTemplate.id,
        addonId: addon2.id,
        orderDisplay: 2,
      });

      await insertAddonPrice({
        addonId: addon1.id,
        priceId: (
          await insertPrice({
            price_in_cents: 100_00,
            currencyId: usdAllowedCurrency.id,
          })
        ).id,
      });

      await insertAddonPrice({
        addonId: addon2.id,
        priceId: (
          await insertPrice({
            price_in_cents: 100_00,
            currencyId: usdAllowedCurrency.id,
          })
        ).id,
      });

      await insertAddonConstraint({
        addonId: addon1.id,
        relatedAddonId: addon2.id,
        constraintType: AddonConstraintType.MUTUAL_EXCLUSION,
      });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  addons: [
                    {
                      addonId: addon1.id,
                      quantity: 1,
                    },
                    {
                      addonId: addon2.id,
                      quantity: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      assertPurchaseError({
        response,
        expectedError: "mutually exclusive",
      });
    });

    it("Should not allow claiming more addons than total stock", async () => {
      const { community, user, ticketTemplate, event, usdAllowedCurrency } =
        await createCommunityEventUserAndTicketTemplate();

      const addon = await insertAddon({
        name: "Limited Addon",
        description: "Limited Addon Description",
        totalStock: 5,
        maxPerTicket: 10,
        isUnlimited: false,
        eventId: event.id,
      });

      await insertTicketAddon({
        ticketId: ticketTemplate.id,
        addonId: addon.id,
        orderDisplay: 1,
      });

      await insertAddonPrice({
        addonId: addon.id,
        priceId: (
          await insertPrice({
            price_in_cents: 100_00,
            currencyId: usdAllowedCurrency.id,
          })
        ).id,
      });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  addons: [
                    {
                      addonId: addon.id,
                      quantity: 6,
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      assertPurchaseError({
        response,
        expectedError: "gone over the limit of addons",
      });
    });

    it("Should allow claiming unlimited addons", async () => {
      const { community, user, ticketTemplate, event, usdAllowedCurrency } =
        await createCommunityEventUserAndTicketTemplate();

      const addon = await insertAddon({
        name: "Unlimited Addon",
        description: "Unlimited Addon Description",
        totalStock: null,
        maxPerTicket: null,
        isUnlimited: true,
        eventId: event.id,
      });

      await insertTicketAddon({
        ticketId: ticketTemplate.id,
        addonId: addon.id,
        orderDisplay: 1,
      });

      await insertAddonPrice({
        addonId: addon.id,
        priceId: (
          await insertPrice({
            price_in_cents: 100_00,
            currencyId: usdAllowedCurrency.id,
          })
        ).id,
      });

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  addons: [
                    {
                      addonId: addon.id,
                      quantity: 100,
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      const result = assertSuccessfulPurchase({
        response,
        expectedTicketsCount: 1,
      });

      assert.equal(result.tickets[0].userTicketAddons.length, 1);

      assert.equal(result.tickets[0].userTicketAddons[0].quantity, 100);

      assert.equal(result.tickets[0].userTicketAddons[0].addon.id, addon.id);
    });
  });

  describe("Should handle complex ticket quantity scenarios", () => {
    it("Should track global ticket count correctly across users", async () => {
      const totalTickets = 10;
      const { community, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          ticketTemplate: {
            quantity: totalTickets,
            maxTicketsPerUser: 5,
            isFree: true,
          },
        });

      const [user1, user2, user3] = await Promise.all([
        insertUser(),
        insertUser(),
        insertUser(),
      ]);

      await Promise.all([
        insertUserToCommunity({
          communityId: community.id,
          userId: user1.id,
          role: "member",
        }),
        insertUserToCommunity({
          communityId: community.id,
          userId: user2.id,
          role: "member",
        }),
        insertUserToCommunity({
          communityId: community.id,
          userId: user3.id,
          role: "member",
        }),
      ]);

      // First user purchases 4 tickets
      const response1 = await executeClaimTicket(user1, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 4,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response: response1,
      });

      // Second user purchases 4 tickets
      const response2 = await executeClaimTicket(user2, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 4,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response: response2,
      });

      // Third purchase should fail as only 2 tickets remain
      const response3 = await executeClaimTicket(user3, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 3,
              itemsDetails: [],
            },
          ],
        },
      });

      assertPurchaseError({
        response: response3,
        expectedError: `We have gone over the limit of tickets for ticket template with id ${ticketTemplate.id}`,
      });

      // should succeed as 2 tickets remain
      const response4 = await executeClaimTicket(user3, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 2,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response: response4,
      });
    });

    it("Should handle concurrent ticket purchases correctly", async () => {
      const totalTickets = 5;
      const { community, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          ticketTemplate: {
            quantity: totalTickets,
            maxTicketsPerUser: 5,
            isFree: true,
          },
        });

      const users = await Promise.all(
        Array(3)
          .fill(null)
          .map(() => insertUser()),
      );

      await Promise.all(
        users.map((user) =>
          insertUserToCommunity({
            communityId: community.id,
            userId: user.id,
            role: "member",
          }),
        ),
      );

      const ticketsPerUser = 2;

      // Attempt concurrent purchases
      const responses = await Promise.all(
        users.map((user) =>
          executeClaimTicket(user, {
            input: {
              purchaseOrder: [
                {
                  ticketId: ticketTemplate.id,
                  quantity: ticketsPerUser,
                  itemsDetails: [],
                },
              ],
            },
          }),
        ),
      );

      // Count successful purchases
      const successfulPurchases = responses.filter(
        (response) =>
          response.data?.claimUserTicket?.__typename === "PurchaseOrder",
      ).length;

      // Verify we didn't oversell tickets
      assert.isTrue(
        successfulPurchases <= Math.floor(totalTickets / ticketsPerUser),
      );
    });

    it("Should handle mixed transfer and direct purchase scenarios", async () => {
      const { community, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          ticketTemplate: {
            quantity: 10,
            maxTicketsPerUser: 3,
            isFree: true,
          },
        });

      const [purchaser, recipient1, recipient2] = await Promise.all([
        insertUser(),
        insertUser(),
        insertUser(),
      ]);

      await Promise.all([
        insertUserToCommunity({
          communityId: community.id,
          userId: purchaser.id,
          role: "member",
        }),
        insertUserToCommunity({
          communityId: community.id,
          userId: recipient1.id,
          role: "member",
        }),
        insertUserToCommunity({
          communityId: community.id,
          userId: recipient2.id,
          role: "member",
        }),
      ]);

      // Purchase tickets with mixed transfer and direct ownership
      const response = await executeClaimTicket(purchaser, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 3,
              itemsDetails: [
                {
                  transferInfo: {
                    name: "Recipient 1",
                    email: recipient1.email,
                    message: "Transfer 1",
                  },
                  addons: [],
                },
                {
                  transferInfo: {
                    name: "Recipient 2",
                    email: recipient2.email,
                    message: "Transfer 2",
                  },
                  addons: [],
                },
              ],
            },
          ],
        },
      });

      const result = assertSuccessfulPurchase({
        response,
        expectedTicketsCount: 3,
      });

      const tickets = result.tickets;

      // Verify transfer attempts
      const transferredTickets = tickets.filter(
        (ticket) => ticket.transferAttempts.length > 0,
      );

      assert.equal(transferredTickets.length, 2);

      // verify the tickets transferred to the correct users
      const recipient1Ticket = transferredTickets.find(
        (ticket) =>
          ticket.transferAttempts[0].recipient.email === recipient1.email,
      );

      const recipient2Ticket = transferredTickets.find(
        (ticket) =>
          ticket.transferAttempts[0].recipient.email === recipient2.email,
      );

      assert.exists(recipient1Ticket);

      assert.exists(recipient2Ticket);

      assert.notEqual(recipient1Ticket?.id, recipient2Ticket?.id);
    });

    it("Should handle edge case of exactly reaching ticket limits", async () => {
      const totalTickets = 3;
      const { community, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          ticketTemplate: {
            quantity: totalTickets,
            maxTicketsPerUser: totalTickets,
            isFree: true,
          },
        });

      const user = await insertUser();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "member",
      });

      // Purchase exactly the maximum number of tickets
      const response1 = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: totalTickets,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response: response1,
        expectedTicketsCount: totalTickets,
      });

      // Attempt to purchase one more ticket
      const response2 = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [],
            },
          ],
        },
      });

      assertPurchaseError({
        response: response2,
        expectedError: `We have gone over the limit of tickets for ticket template with id ${ticketTemplate.id}`,
      });
    });
  });
});
