import { assert, describe, it, vi, expect, beforeEach } from "vitest";

import { InsertEventSchema } from "~/datasources/db/events";
import { AddonConstraintType } from "~/datasources/db/ticketAddons";
import { InsertTicketSchema } from "~/datasources/db/tickets";
import { InsertUserSchema } from "~/datasources/db/users";
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
                  itemsDetails: [],
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                  itemsDetails: [],
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
                  itemsDetails: [],
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                  itemsDetails: [],
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
                  itemsDetails: [],
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                  itemsDetails: [],
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
      const { user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate({
          user: {
            isSuperAdmin: true,
          },
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
                  itemsDetails: [],
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                  itemsDetails: [],
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
                  itemsDetails: [],
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                  itemsDetails: [],
                },
              ],
            },
          },
        },
        user,
      );

      assert.equal(
        response.data?.claimUserTicket?.__typename,
        "RedeemUserTicketError",
      );

      if (
        response.data?.claimUserTicket?.__typename === "RedeemUserTicketError"
      ) {
        assert.equal(
          response.data?.claimUserTicket.errorMessage,
          `You cannot get more than ${maxTicketsPerUser} for ticket ${ticketTemplate.id}`,
        );
      }
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
                  itemsDetails: [],
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                  itemsDetails: [],
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
          `We have gone over the limit of tickets for ticket template with id ${ticketTemplate.id}`,
        );
      }
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
                  quantity: 5,
                  itemsDetails: [],
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
        assert.equal(response.data.claimUserTicket.tickets.length, 5);
      }
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
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.claimUserTicket?.__typename, "PurchaseOrder");

      if (response.data?.claimUserTicket?.__typename === "PurchaseOrder") {
        assert.equal(response.data.claimUserTicket.tickets.length, 2);

        assert.equal(
          response.data.claimUserTicket.tickets[0].transferAttempts.length,
          1,
        );

        assert.equal(
          response.data.claimUserTicket.tickets[0].transferAttempts[0].recipient
            .email,
          transferRecipient.email,
        );
      }
    });

    it("Should not allow transferring to self", async () => {
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
          response.data.claimUserTicket.errorMessage,
          "Cannot transfer to yourself",
        );
      }
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
                  itemsDetails: [],
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
          `Ticket ${ticketTemplate.id} is a waitlist ticket. Cannot claim waitlist tickets`,
        );
      }
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
                  itemsDetails: [],
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                  itemsDetails: [],
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
          id: "00000000-0000-0000-0000-000000000000",
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
                  itemsDetails: [],
                },
              ],
              generatePaymentLink: {
                currencyId: "some-currency-id",
              },
            },
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.claimUserTicket?.__typename, "PurchaseOrder");

      if (response.data?.claimUserTicket?.__typename === "PurchaseOrder") {
        assert.equal(
          response.data.claimUserTicket.paymentLink,
          "https://stripe.com/pay/123",
        );

        assert.equal(response.data.claimUserTicket.paymentPlatform, "stripe");
      }

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
                  itemsDetails: [],
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
        assert.isNull(response.data.claimUserTicket.paymentLink);

        assert.isNull(response.data.claimUserTicket.paymentPlatform);
      }

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
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.claimUserTicket?.__typename, "PurchaseOrder");

      if (response.data?.claimUserTicket?.__typename === "PurchaseOrder") {
        assert.equal(response.data.claimUserTicket.tickets.length, 1);

        assert.equal(
          response.data.claimUserTicket.tickets[0].userTicketAddons.length,
          1,
        );

        assert.equal(
          response.data.claimUserTicket.tickets[0].userTicketAddons[0].quantity,
          2,
        );

        assert.equal(
          response.data.claimUserTicket.tickets[0].userTicketAddons[0].addon.id,
          addon.id,
        );
      }
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
        assert.include(
          response.data.claimUserTicket.errorMessage,
          `total quantity exceeds limit per ticket for ticket`,
        );
      }
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
        assert.include(
          response.data.claimUserTicket.errorMessage,
          `Addon ${addon.id} is not related to ticket ${ticketTemplate.id}`,
        );
      }
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
        assert.include(
          response.data.claimUserTicket.errorMessage,
          "mutually exclusive",
        );
      }
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
        assert.include(
          response.data.claimUserTicket.errorMessage,
          "gone over the limit of addons",
        );
      }
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
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.claimUserTicket?.__typename, "PurchaseOrder");

      if (response.data?.claimUserTicket?.__typename === "PurchaseOrder") {
        assert.equal(response.data.claimUserTicket.tickets.length, 1);

        assert.equal(
          response.data.claimUserTicket.tickets[0].userTicketAddons.length,
          1,
        );

        assert.equal(
          response.data.claimUserTicket.tickets[0].userTicketAddons[0].quantity,
          100,
        );

        assert.equal(
          response.data.claimUserTicket.tickets[0].userTicketAddons[0].addon.id,
          addon.id,
        );
      }
    });
  });
});
