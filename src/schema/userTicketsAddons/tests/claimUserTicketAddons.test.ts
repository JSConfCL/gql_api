import { assert, beforeEach, describe, it, vi } from "vitest";

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
          userTicketId: userTicket.id,
          addonsClaims: [{ addonId: addon.id, quantity: 1 }],
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
          userTicketId: userTicket.id,
          addonsClaims: [{ addonId: addon.id, quantity: 1 }],
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
        id: "po_test_123",
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
          userTicketId: userTicket.id,
          addonsClaims: [{ addonId: addon.id, quantity: 1 }],
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
          userTicketId: userTicket.id,
          addonsClaims: [{ addonId: addon.id, quantity: 3 }],
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

  it("should fail when claiming duplicate addon IDs", async () => {
    const event = await insertEvent();
    const user = await insertUser();
    const ticket = await insertTicketTemplate({ eventId: event.id });
    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
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
          userTicketId: userTicket.id,
          addonsClaims: [
            { addonId: addon.id, quantity: 1 },
            { addonId: addon.id, quantity: 1 },
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
        "Duplicated addon ids",
      );
    }
  });

  it("should fail when claiming addons for non-approved ticket", async () => {
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
          userTicketId: userTicket.id,
          addonsClaims: [{ addonId: addon.id, quantity: 1 }],
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
        "User ticket is not approved",
      );
    }
  });
});
