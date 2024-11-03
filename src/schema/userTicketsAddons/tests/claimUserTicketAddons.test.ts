import { assert, beforeEach, describe, it, vi } from "vitest";

import { AddonConstraintType } from "~/datasources/db/ticketAddons";
import { handlePaymentLinkGeneration } from "~/schema/purchaseOrder/actions";
import {
  executeGraphqlOperationAsUser,
  insertAllowedCurrency,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertPrice,
  insertTicketTemplate,
  insertUser,
  insertUserToCommunity,
  insertAddon,
  insertTicketAddon,
  insertAddonPrice,
  insertTicket,
  SAMPLE_TEST_UUID,
  insertAddonConstraint,
} from "~/tests/fixtures";

import {
  ClaimUserTicketAddons,
  ClaimUserTicketAddonsMutation,
  ClaimUserTicketAddonsMutationVariables,
} from "./claimUserTicketAddons.generated";

// Add this mock setup at the top of the file, before the describe blocks
vi.mock("~/schema/purchaseOrder/actions", () => ({
  handlePaymentLinkGeneration: vi.fn(),
}));

describe("claimUserTicketAddons mutation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should successfully claim free addons", async () => {
    // Setup
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: true,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const addon = await insertAddon({
      name: "Free Addon",
      description: "Free Addon Description",
      totalStock: 100,
      maxPerTicket: 2,
      isUnlimited: false,
      eventId: event.id,
      isFree: true,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon.id,
      orderDisplay: 1,
    });

    await insertUserToCommunity({
      communityId: community.id,
      userId: user.id,
      role: "member",
    });

    // Execute
    const response = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: addon.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    // Verify
    assert.equal(response.errors, undefined);

    assert.equal(
      response.data?.claimUserTicketAddons.__typename,
      "PurchaseOrder",
    );

    if (response.data?.claimUserTicketAddons.__typename === "PurchaseOrder") {
      assert.exists(response.data.claimUserTicketAddons.id);

      assert.exists(response.data.claimUserTicketAddons.status);
    }
  });

  it("should fail when claiming non-free addons without currency", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: false,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const addon = await insertAddon({
      name: "Paid Addon",
      description: "Paid Addon Description",
      totalStock: 100,
      maxPerTicket: 2,
      isUnlimited: false,
      eventId: event.id,
      isFree: false,
    });

    const usdCurrency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon.id,
      orderDisplay: 1,
    });

    await insertAddonPrice({
      addonId: addon.id,
      priceId: (
        await insertPrice({
          price_in_cents: 1000,
          currencyId: usdCurrency.id,
        })
      ).id,
    });

    const response = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: addon.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(response.errors, undefined);

    assert.equal(
      response.data?.claimUserTicketAddons.__typename,
      "RedeemUserTicketAddonsError",
    );

    if (
      response.data?.claimUserTicketAddons.__typename ===
      "RedeemUserTicketAddonsError"
    ) {
      assert.include(
        response.data?.claimUserTicketAddons.errorMessage,
        "Currency ID is required",
      );
    }
  });

  it("should handle payment link generation for paid addons", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const addon = await insertAddon({
      name: "Paid Addon",
      description: "Paid Addon Description",
      totalStock: 100,
      maxPerTicket: 2,
      isUnlimited: false,
      eventId: event.id,
      isFree: false,
    });

    const usdCurrency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon.id,
      orderDisplay: 1,
    });

    await insertAddonPrice({
      addonId: addon.id,
      priceId: (
        await insertPrice({
          price_in_cents: 1000,
          currencyId: usdCurrency.id,
        })
      ).id,
    });

    // Update the mock to match the structure in claimUserTicket.test.ts
    vi.mocked(handlePaymentLinkGeneration).mockResolvedValue({
      purchaseOrder: {
        id: SAMPLE_TEST_UUID,
        publicId: "some-public-id",
        userId: user.id,
        idempotencyUUIDKey: "some-idempotency-key",
        totalPrice: "1000",
        description: null,
        status: "open",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        currencyId: usdCurrency.id,
        paymentPlatform: "stripe",
        paymentPlatformPaymentLink: "https://test-payment-link.com",
        purchaseOrderPaymentStatus: "not_required",
        paymentPlatformExpirationDate: null,
        paymentPlatformReferenceID: null,
        paymentPlatformStatus: null,
        paymentPlatformMetadata: null,
      },
      ticketsIds: [],
    });

    const response = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: addon.id,
              quantity: 1,
            },
          ],
          currencyId: usdCurrency.id,
        },
      },
      user,
    );

    assert.equal(response.errors, undefined);

    assert.equal(
      response.data?.claimUserTicketAddons.__typename,
      "PurchaseOrder",
    );

    if (response.data?.claimUserTicketAddons.__typename === "PurchaseOrder") {
      assert.equal(
        response.data?.claimUserTicketAddons.paymentLink,
        "https://test-payment-link.com",
      );

      assert.equal(response.data?.claimUserTicketAddons.status, "open");
    }
  });

  it("should fail when claiming more addons than maxPerTicket", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const addon = await insertAddon({
      name: "Limited Addon",
      description: "Limited Addon Description",
      totalStock: 100,
      maxPerTicket: 2,
      isUnlimited: false,
      eventId: event.id,
      isFree: true,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon.id,
      orderDisplay: 1,
    });

    const response = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: addon.id,
              quantity: 3,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(
      response.data?.claimUserTicketAddons.__typename,
      "RedeemUserTicketAddonsError",
    );

    if (
      response.data?.claimUserTicketAddons.__typename ===
      "RedeemUserTicketAddonsError"
    ) {
      assert.include(
        response.data?.claimUserTicketAddons.errorMessage,
        "total quantity exceeds limit per ticket for ticket",
      );
    }
  });

  it("should fail when claiming addons for non valid approval user ticket status", async () => {
    const event = await insertEvent();
    const user = await insertUser();
    const ticket = await insertTicketTemplate({ eventId: event.id });
    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "pending",
    });
    const addon = await insertAddon({
      name: "Free Addon",
      eventId: event.id,
      isFree: true,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon.id,
      orderDisplay: 1,
    });

    const response = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: addon.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(
      response.data?.claimUserTicketAddons.__typename,
      "RedeemUserTicketAddonsError",
    );

    if (
      response.data?.claimUserTicketAddons.__typename ===
      "RedeemUserTicketAddonsError"
    ) {
      assert.include(
        response.data?.claimUserTicketAddons.errorMessage,
        "because it's not in a valid approval status",
      );
    }
  });

  it("should successfully claim multiple free addons for different tickets in different events", async () => {
    const community1 = await insertCommunity();
    const community2 = await insertCommunity();
    const event1 = await insertEvent();
    const event2 = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });

    await insertEventToCommunity({
      eventId: event2.id,
      communityId: community2.id,
    });

    const ticket1 = await insertTicketTemplate({
      eventId: event2.id,
      quantity: 100,
      isFree: true,
    });

    const ticket2 = await insertTicketTemplate({
      eventId: event2.id,
      quantity: 100,
      isFree: true,
    });

    const userTicket1 = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket1.id,
      approvalStatus: "approved",
    });

    const userTicket2 = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket2.id,
      approvalStatus: "approved",
    });

    const addon1 = await insertAddon({
      name: "Free Addon 1",
      eventId: event1.id,
      isFree: true,
      maxPerTicket: 2,
    });

    const addon2 = await insertAddon({
      name: "Free Addon 2",
      eventId: event2.id,
      isFree: true,
      maxPerTicket: 1,
    });

    await insertTicketAddon({
      ticketId: ticket1.id,
      addonId: addon1.id,
      orderDisplay: 1,
    });

    await insertTicketAddon({
      ticketId: ticket2.id,
      addonId: addon2.id,
      orderDisplay: 1,
    });

    const response = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket1.id,
              addonId: addon1.id,
              quantity: 2,
            },
            {
              userTicketId: userTicket2.id,
              addonId: addon2.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(response.errors, undefined);

    assert.equal(
      response.data?.claimUserTicketAddons.__typename,
      "PurchaseOrder",
    );

    if (response.data?.claimUserTicketAddons.__typename === "PurchaseOrder") {
      assert.exists(response.data.claimUserTicketAddons.id);

      // Check userTicketAddons array length and quantities
      const userTicketAddons =
        response.data.claimUserTicketAddons.userTicketAddons;

      assert.equal(userTicketAddons.length, 2); // 1 for addon1 + 1 for addon2

      // Check addons for first ticket
      const ticket1Addons = userTicketAddons.filter(
        (addon) => addon.userTicketId === userTicket1.id,
      );

      assert.equal(ticket1Addons.length, 1);

      assert.equal(ticket1Addons[0].quantity, 2);

      assert.equal(ticket1Addons[0].addonId, addon1.id);

      // Check addons for second ticket
      const ticket2Addons = userTicketAddons.filter(
        (addon) => addon.userTicketId === userTicket2.id,
      );

      assert.equal(ticket2Addons.length, 1);

      assert.equal(ticket2Addons[0].addonId, addon2.id);
    }
  });

  it("should successfully claim mix of free and paid addons for different tickets", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();
    const usdCurrency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket1 = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const ticket2 = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket1 = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket1.id,
      approvalStatus: "approved",
    });

    const userTicket2 = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket2.id,
      approvalStatus: "approved",
    });

    const freeAddon = await insertAddon({
      name: "Free Addon",
      eventId: event.id,
      isFree: true,
      maxPerTicket: 2,
    });

    const paidAddon = await insertAddon({
      name: "Paid Addon",
      eventId: event.id,
      isFree: false,
      maxPerTicket: 1,
    });

    await insertTicketAddon({
      ticketId: ticket1.id,
      addonId: freeAddon.id,
      orderDisplay: 1,
    });

    await insertTicketAddon({
      ticketId: ticket2.id,
      addonId: paidAddon.id,
      orderDisplay: 1,
    });

    await insertAddonPrice({
      addonId: paidAddon.id,
      priceId: (
        await insertPrice({
          price_in_cents: 1000,
          currencyId: usdCurrency.id,
        })
      ).id,
    });

    vi.mocked(handlePaymentLinkGeneration).mockResolvedValue({
      purchaseOrder: {
        id: SAMPLE_TEST_UUID,
        publicId: "some-public-id",
        userId: user.id,
        status: "open",
        currencyId: usdCurrency.id,
        paymentPlatform: "stripe",
        paymentPlatformPaymentLink: "https://test-payment-link.com",
        description: null,
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        idempotencyUUIDKey: "some-idempotency-key",
        totalPrice: "1000",
        paymentPlatformExpirationDate: null,
        paymentPlatformReferenceID: null,
        paymentPlatformStatus: null,
        paymentPlatformMetadata: null,
        purchaseOrderPaymentStatus: "not_required",
      },
      ticketsIds: [userTicket1.id, userTicket2.id],
    });

    const response = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket1.id,
              addonId: freeAddon.id,
              quantity: 2,
            },
            {
              userTicketId: userTicket2.id,
              addonId: paidAddon.id,
              quantity: 1,
            },
          ],
          currencyId: usdCurrency.id,
        },
      },
      user,
    );

    assert.equal(response.errors, undefined);

    assert.equal(
      response.data?.claimUserTicketAddons.__typename,
      "PurchaseOrder",
    );
  });

  it("should fail when claiming paid addons from different communities but allow free ones", async () => {
    const community1 = await insertCommunity();
    const community2 = await insertCommunity();
    const event1 = await insertEvent();
    const event2 = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });

    await insertEventToCommunity({
      eventId: event2.id,
      communityId: community2.id,
    });

    const ticket1 = await insertTicketTemplate({
      eventId: event1.id,
      quantity: 100,
      isFree: true,
    });

    const ticket2 = await insertTicketTemplate({
      eventId: event2.id,
      quantity: 100,
      isFree: true,
    });

    const userTicket1 = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket1.id,
      approvalStatus: "approved",
    });

    const userTicket2 = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket2.id,
      approvalStatus: "approved",
    });

    const addon1 = await insertAddon({
      name: "Free Addon",
      eventId: event1.id,
      isFree: true,
    });

    const addon2 = await insertAddon({
      name: "Paid Addon",
      eventId: event2.id,
      isFree: false,
    });

    const usdCurrency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });

    await insertAddonPrice({
      addonId: addon2.id,
      priceId: (
        await insertPrice({
          price_in_cents: 1000,
          currencyId: usdCurrency.id,
        })
      ).id,
    });

    await insertTicketAddon({
      ticketId: ticket1.id,
      addonId: addon1.id,
      orderDisplay: 1,
    });

    await insertTicketAddon({
      ticketId: ticket2.id,
      addonId: addon2.id,
      orderDisplay: 1,
    });

    const response = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket1.id,
              addonId: addon1.id,
              quantity: 1,
            },
            {
              userTicketId: userTicket2.id,
              addonId: addon2.id,
              quantity: 1,
            },
          ],
          currencyId: usdCurrency.id,
        },
      },
      user,
    );

    assert.equal(
      response.data?.claimUserTicketAddons.__typename,
      "RedeemUserTicketAddonsError",
    );

    if (
      response.data?.claimUserTicketAddons.__typename ===
      "RedeemUserTicketAddonsError"
    ) {
      assert.include(
        response.data?.claimUserTicketAddons.errorMessage,
        "Multiple events found for related user tickets",
      );
    }
  });

  it("should fail when new claim plus existing addons exceeds maxPerTicket", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const addon = await insertAddon({
      name: "Limited Addon",
      description: "Limited Addon Description",
      totalStock: 100,
      maxPerTicket: 2,
      isUnlimited: false,
      eventId: event.id,
      isFree: true,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon.id,
      orderDisplay: 1,
    });

    // First claim - should succeed
    const firstResponse = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: addon.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(
      firstResponse.data?.claimUserTicketAddons.__typename,
      "PurchaseOrder",
    );

    // Second claim - should fail because total would exceed maxPerTicket
    const secondResponse = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: addon.id,
              quantity: 2,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(
      secondResponse.data?.claimUserTicketAddons.__typename,
      "RedeemUserTicketAddonsError",
    );

    if (
      secondResponse.data?.claimUserTicketAddons.__typename ===
      "RedeemUserTicketAddonsError"
    ) {
      assert.include(
        secondResponse.data?.claimUserTicketAddons.errorMessage,
        "total quantity exceeds limit per ticket for ticket",
      );
    }
  });

  it("should fail when claiming an addon that is mutually exclusive with an existing one", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    // Create two mutually exclusive addons
    const addon1 = await insertAddon({
      name: "Addon 1",
      description: "First addon",
      totalStock: 100,
      isUnlimited: false,
      eventId: event.id,
      isFree: true,
    });

    const addon2 = await insertAddon({
      name: "Addon 2",
      description: "Second addon",
      totalStock: 100,
      isUnlimited: false,
      eventId: event.id,
      isFree: true,
    });

    // Set up mutual exclusion constraint
    await insertAddonConstraint({
      addonId: addon1.id,
      relatedAddonId: addon2.id,
      constraintType: AddonConstraintType.MUTUAL_EXCLUSION,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon1.id,
      orderDisplay: 1,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon2.id,
      orderDisplay: 2,
    });

    // First claim addon1 - should succeed
    const firstResponse = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: addon1.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(
      firstResponse.data?.claimUserTicketAddons.__typename,
      "PurchaseOrder",
    );

    // Try to claim addon2 - should fail due to mutual exclusion
    const secondResponse = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: addon2.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(
      secondResponse.data?.claimUserTicketAddons.__typename,
      "RedeemUserTicketAddonsError",
    );

    if (
      secondResponse.data?.claimUserTicketAddons.__typename ===
      "RedeemUserTicketAddonsError"
    ) {
      assert.include(
        secondResponse.data?.claimUserTicketAddons.errorMessage,
        "is mutually exclusive with addon",
      );
    }
  });

  it("should succeed when claiming multiple non-conflicting addons sequentially", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    // Create two independent addons
    const addon1 = await insertAddon({
      name: "Addon 1",
      description: "First addon",
      totalStock: 100,
      isUnlimited: false,
      eventId: event.id,
      isFree: true,
    });

    const addon2 = await insertAddon({
      name: "Addon 2",
      description: "Second addon",
      totalStock: 100,
      isUnlimited: false,
      eventId: event.id,
      isFree: true,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon1.id,
      orderDisplay: 1,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon2.id,
      orderDisplay: 2,
    });

    // First claim addon1 - should succeed
    const firstResponse = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: addon1.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(
      firstResponse.data?.claimUserTicketAddons.__typename,
      "PurchaseOrder",
    );

    // Claim addon2 - should also succeed
    const secondResponse = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: addon2.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(
      secondResponse.data?.claimUserTicketAddons.__typename,
      "PurchaseOrder",
    );
  });

  it("should enforce addon dependencies correctly", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    // Create dependent addons
    const baseAddon = await insertAddon({
      name: "Base Addon",
      description: "Required addon",
      totalStock: 100,
      isUnlimited: false,
      eventId: event.id,
      isFree: true,
    });

    const dependentAddon = await insertAddon({
      name: "Dependent Addon",
      description: "Requires base addon",
      totalStock: 100,
      isUnlimited: false,
      eventId: event.id,
      isFree: true,
    });

    // Set up dependency constraint
    await insertAddonConstraint({
      addonId: dependentAddon.id,
      relatedAddonId: baseAddon.id,
      constraintType: AddonConstraintType.DEPENDENCY,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: baseAddon.id,
      orderDisplay: 1,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: dependentAddon.id,
      orderDisplay: 2,
    });

    // Try to claim dependent addon without base - should fail
    const failedResponse = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: dependentAddon.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(
      failedResponse.data?.claimUserTicketAddons.__typename,
      "RedeemUserTicketAddonsError",
    );

    if (
      failedResponse.data?.claimUserTicketAddons.__typename ===
      "RedeemUserTicketAddonsError"
    ) {
      assert.include(
        failedResponse.data?.claimUserTicketAddons.errorMessage,
        "requires addon",
      );
    }

    // Claim base addon first - should succeed
    const baseResponse = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: baseAddon.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(
      baseResponse.data?.claimUserTicketAddons.__typename,
      "PurchaseOrder",
    );

    // Now claim dependent addon - should succeed
    const dependentResponse = await executeGraphqlOperationAsUser<
      ClaimUserTicketAddonsMutation,
      ClaimUserTicketAddonsMutationVariables
    >(
      {
        document: ClaimUserTicketAddons,
        variables: {
          addonsClaims: [
            {
              userTicketId: userTicket.id,
              addonId: dependentAddon.id,
              quantity: 1,
            },
          ],
          currencyId: null,
        },
      },
      user,
    );

    assert.equal(
      dependentResponse.data?.claimUserTicketAddons.__typename,
      "PurchaseOrder",
    );
  });
});
