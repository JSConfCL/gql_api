import {
  assert,
  describe,
  it,
  vi,
  expect,
  beforeEach,
  beforeAll,
} from "vitest";

import { SelectAllowedCurrencySchema } from "~/datasources/db/allowedCurrencies";
import { SelectCommunitySchema } from "~/datasources/db/communities";
import type {
  InsertEventSchema,
  SelectEventSchema,
} from "~/datasources/db/events";
import { AddonConstraintType } from "~/datasources/db/ticketAddons";
import { SelectTicketPriceSchema } from "~/datasources/db/ticketPrice";
import type {
  InsertTicketSchema,
  SelectTicketSchema,
} from "~/datasources/db/tickets";
import type { InsertUserSchema, USER } from "~/datasources/db/users";
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
  insertTicketAddon,
  insertAddonConstraint,
  SAMPLE_TEST_UUID,
} from "~/tests/fixtures";

import {
  ClaimUserTicket,
  type ClaimUserTicketMutation,
  type ClaimUserTicketMutationVariables,
} from "./claimUserTicket.generated";

interface TestSetupOptions {
  ticketTemplate?: Partial<InsertTicketSchema>;
  user?: Partial<InsertUserSchema>;
  event?: Partial<InsertEventSchema>;
}

interface TestSetupResult {
  community: SelectCommunitySchema;
  event: SelectEventSchema;
  user: USER;
  ticketTemplate: SelectTicketSchema;
  ticketPrice: SelectTicketPriceSchema;
  usdAllowedCurrency: SelectAllowedCurrencySchema;
}

const createTestSetup = async ({
  ticketTemplate = {},
  user = {},
  event = {},
}: TestSetupOptions = {}): Promise<TestSetupResult> => {
  const [createdCommunity, usdAllowedCurrency, createdEvent, createdUser] =
    await Promise.all([
      insertCommunity(),
      insertAllowedCurrency({ currency: "USD", validPaymentMethods: "stripe" }),
      insertEvent({ ...event }),
      insertUser({ ...user }),
    ]);

  const [createdTicketTemplate, price] = await Promise.all([
    insertTicketTemplate({
      eventId: createdEvent.id,
      quantity: 100,
      isFree: false,
      isUnlimited: false,
      ...ticketTemplate,
    }),
    insertPrice({
      price_in_cents: 100_00,
      currencyId: usdAllowedCurrency.id,
    }),
    insertEventToCommunity({
      eventId: createdEvent.id,
      communityId: createdCommunity.id,
    }),
  ]);

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

const setupAddonTest = async ({
  testSetup,
  addonOptions = {},
  orderDisplay = 1,
}: {
  testSetup: TestSetupResult;
  addonOptions?: Partial<{
    name: string;
    description: string;
    totalStock: number | null;
    maxPerTicket: number | null;
    isUnlimited: boolean;
    eventId: string;
  }>;
  orderDisplay?: number;
}) => {
  const { event, ticketTemplate } = testSetup;

  const addon = await insertAddon({
    name: "Test Addon",
    description: "Test Addon Description",
    totalStock: 100,
    maxPerTicket: 2,
    isUnlimited: false,
    eventId: event.id,
    ...addonOptions,
  });

  await insertTicketAddon({
    ticketId: ticketTemplate.id,
    addonId: addon.id,
    orderDisplay,
  });

  return addon;
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
  beforeAll(() => {
    vi.resetAllMocks();
  });

  describe("Should allow claiming", () => {
    it("For different user roles including SUPER ADMIN", async () => {
      const roles = ["member", "admin", "collaborator"] as const;

      // Create base setup once
      const baseSetup = await createTestSetup();
      const { community, ticketTemplate } = baseSetup;

      // Create all users (including SUPER ADMIN) and their community memberships in parallel
      const userSetups = await Promise.all([
        // Regular roles
        ...roles.map(async (role) => {
          const user = await insertUser();

          await insertUserToCommunity({
            communityId: community.id,
            userId: user.id,
            role,
          });

          return { user, role };
        }),
        // SUPER ADMIN
        (async () => {
          const user = await insertUser({ isSuperAdmin: true });

          return { user, role: "SUPER ADMIN" as const };
        })(),
      ]);

      // Run all ticket claims in parallel
      const results = await Promise.all(
        userSetups.map(({ user }) =>
          executeClaimTicket(user, {
            input: {
              purchaseOrder: [
                {
                  ticketId: ticketTemplate.id,
                  quantity: 2,
                  itemsDetails: [],
                },
              ],
            },
          }),
        ),
      );

      // Assert all results
      results.forEach((response, index) => {
        assertSuccessfulPurchase({
          response,
          expectedTicketsCount: 2,
          message: `Should work for ${userSetups[index].role} role`,
        });
      });
    });
  });

  describe("Should handle quantity limits", () => {
    it("Should not allow claiming more tickets than the max per user", async () => {
      const MAX_TICKETS_PER_USER = 2;
      const { user, ticketTemplate } = await createTestSetup({
        ticketTemplate: {
          maxTicketsPerUser: MAX_TICKETS_PER_USER,
          quantity: 200,
          isFree: false,
        },
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: MAX_TICKETS_PER_USER,
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
        expectedError: `You cannot get more than ${MAX_TICKETS_PER_USER}`,
      });
    });

    it("Should not allow claiming more tickets than available", async () => {
      const MAX_TICKETS = 5;

      const { user, ticketTemplate } = await createTestSetup({
        ticketTemplate: {
          quantity: MAX_TICKETS,
        },
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: MAX_TICKETS + 1,
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
      const MAX_GLOBAL_TICKETS_AND_PER_USER = 5;

      const { community, user, ticketTemplate } = await createTestSetup({
        ticketTemplate: {
          quantity: MAX_GLOBAL_TICKETS_AND_PER_USER,
          isFree: true,
          isUnlimited: false,
          maxTicketsPerUser: MAX_GLOBAL_TICKETS_AND_PER_USER,
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
              quantity: MAX_GLOBAL_TICKETS_AND_PER_USER,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response,
        expectedTicketsCount: MAX_GLOBAL_TICKETS_AND_PER_USER,
      });
    });

    it("Should not count transferred tickets towards maxTicketsPerUser limit", async () => {
      const MAX_TICKETS_PER_USER = 2;

      const [{ user, ticketTemplate }, transferRecipient] = await Promise.all([
        createTestSetup({
          ticketTemplate: {
            maxTicketsPerUser: MAX_TICKETS_PER_USER,
          },
        }),
        insertUser(),
      ]);

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

      assertSuccessfulPurchase({ response: response1 });

      // Second claim for maxTicketsPerUser tickets - should succeed as transferred tickets don't count
      const response2 = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: MAX_TICKETS_PER_USER,
              itemsDetails: [],
            },
          ],
        },
      });

      assertSuccessfulPurchase({
        response: response2,
        expectedTicketsCount: MAX_TICKETS_PER_USER,
      });
    });
  });

  describe("Should handle transferring scenarios", () => {
    it("Should handle transferring to another user", async () => {
      const [{ user, ticketTemplate }, transferRecipient] = await Promise.all([
        createTestSetup(),
        insertUser(),
      ]);

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

      const result = assertSuccessfulPurchase({
        response,
        expectedTicketsCount: 2,
      });

      assert.equal(result.tickets[0].transferAttempts.length, 1);

      assert.equal(
        result.tickets[0].transferAttempts[0].recipient.email,
        transferRecipient.email,
      );
    });

    it("Should not allow transferring to self", async () => {
      const { user, ticketTemplate } = await createTestSetup();

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
      const { user, ticketTemplate } = await createTestSetup({
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
      const { user, ticketTemplate, event } = await createTestSetup({
        event: {
          status: "inactive",
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
      const { user, ticketTemplate, usdAllowedCurrency } =
        await createTestSetup();

      vi.mocked(handlePaymentLinkGeneration).mockResolvedValue({
        purchaseOrder: {
          id: SAMPLE_TEST_UUID,
          publicId: "some-public-id",
          userId: user.id,
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
            currencyId: usdAllowedCurrency.id,
          },
        },
      });

      const result = assertSuccessfulPurchase({
        response,
      });

      assert.equal(result.paymentLink, "https://stripe.com/pay/123");

      assert.equal(result.paymentPlatform, "stripe");

      expect(handlePaymentLinkGeneration).toHaveBeenCalled();
    });

    it("Should not generate a payment link when not requested", async () => {
      const { user, ticketTemplate } = await createTestSetup();

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

      const result = assertSuccessfulPurchase({
        response,
      });

      assert.isNull(result.paymentLink);

      assert.isNull(result.paymentPlatform);

      expect(handlePaymentLinkGeneration).not.toHaveBeenCalled();
    });
  });

  describe("Addon handling", () => {
    it("Should allow claiming tickets with addons", async () => {
      const testSetup = await createTestSetup();
      const { user, ticketTemplate } = testSetup;
      const addon = await setupAddonTest({ testSetup });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  addons: [{ addonId: addon.id, quantity: 2 }],
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

      assert.equal(result.tickets[0].userTicketAddons[0].quantity, 2);

      assert.equal(result.tickets[0].userTicketAddons[0].addon.id, addon.id);
    });

    it("Should not allow claiming more addons than maxPerTicket", async () => {
      const testSetup = await createTestSetup();
      const { user, ticketTemplate } = testSetup;
      const addon = await setupAddonTest({ testSetup });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  addons: [{ addonId: addon.id, quantity: 3 }],
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
      const testSetup = await createTestSetup();
      const { user, ticketTemplate, event } = testSetup;

      // Not associating the addon with the ticket
      const addon = await insertAddon({
        name: "Test Addon",
        description: "Test Addon Description",
        totalStock: 100,
        maxPerTicket: 2,
        isUnlimited: false,
        eventId: event.id,
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  addons: [{ addonId: addon.id, quantity: 1 }],
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
      const testSetup = await createTestSetup();
      const { user, ticketTemplate } = testSetup;

      const [addon1, addon2] = await Promise.all([
        setupAddonTest({
          testSetup,
          addonOptions: {
            name: "Addon 1",
            description: "Addon 1 Description",
            totalStock: 100,
            maxPerTicket: 1,
            isUnlimited: false,
          },
          orderDisplay: 1,
        }),
        setupAddonTest({
          testSetup,
          addonOptions: {
            name: "Addon 2",
            description: "Addon 2 Description",
            totalStock: 100,
            maxPerTicket: 1,
            isUnlimited: false,
          },
          orderDisplay: 2,
        }),
      ]);

      await insertAddonConstraint({
        addonId: addon1.id,
        relatedAddonId: addon2.id,
        constraintType: AddonConstraintType.MUTUAL_EXCLUSION,
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
                    { addonId: addon1.id, quantity: 1 },
                    { addonId: addon2.id, quantity: 1 },
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
      const testSetup = await createTestSetup();
      const { user, ticketTemplate } = testSetup;

      const MAX_ADDON_TOTAL_STOCK = 5;

      const addon = await setupAddonTest({
        testSetup,
        addonOptions: {
          name: "Limited Addon",
          description: "Limited Addon Description",
          totalStock: MAX_ADDON_TOTAL_STOCK,
          maxPerTicket: 10,
          isUnlimited: false,
        },
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
                    { addonId: addon.id, quantity: MAX_ADDON_TOTAL_STOCK + 1 },
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
      const testSetup = await createTestSetup();
      const { user, ticketTemplate } = testSetup;
      const addon = await setupAddonTest({
        testSetup,
        addonOptions: {
          name: "Unlimited Addon",
          description: "Unlimited Addon Description",
          totalStock: null,
          maxPerTicket: null,
          isUnlimited: true,
        },
      });

      const response = await executeClaimTicket(user, {
        input: {
          purchaseOrder: [
            {
              ticketId: ticketTemplate.id,
              quantity: 1,
              itemsDetails: [
                {
                  addons: [{ addonId: addon.id, quantity: 1000 }],
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

      assert.equal(result.tickets[0].userTicketAddons[0].quantity, 1000);

      assert.equal(result.tickets[0].userTicketAddons[0].addon.id, addon.id);
    });
  });

  describe("Should handle complex ticket quantity scenarios", () => {
    it("Should track global ticket count correctly across users", async () => {
      const TOTAL_TICKETS = 10;
      const MAX_TICKETS_PER_USER = 5;
      const [{ ticketTemplate, user }, user2, user3] = await Promise.all([
        createTestSetup({
          ticketTemplate: {
            quantity: TOTAL_TICKETS,
            maxTicketsPerUser: MAX_TICKETS_PER_USER,
            isFree: true,
          },
        }),
        insertUser(),
        insertUser(),
      ]);

      // First user purchases 4 tickets
      const response1 = await executeClaimTicket(user, {
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
      const TOTAL_TICKETS = 5;
      const MAX_TICKETS_PER_USER = 5;
      const [{ ticketTemplate }, ...users] = await Promise.all([
        createTestSetup({
          ticketTemplate: {
            quantity: TOTAL_TICKETS,
            maxTicketsPerUser: MAX_TICKETS_PER_USER,
            isFree: true,
          },
        }),
        ...Array(3)
          .fill(null)
          .map(() => insertUser()),
      ]);

      const TICKETS_PER_USER = 2;

      // Attempt concurrent purchases
      const responses = await Promise.all(
        users.map((user) =>
          executeClaimTicket(user, {
            input: {
              purchaseOrder: [
                {
                  ticketId: ticketTemplate.id,
                  quantity: TICKETS_PER_USER,
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
        successfulPurchases <= Math.floor(TOTAL_TICKETS / TICKETS_PER_USER),
      );
    });

    it("Should handle mixed transfer and direct purchase scenarios", async () => {
      const [{ ticketTemplate, user: purchaser }, recipient1, recipient2] =
        await Promise.all([
          createTestSetup({
            ticketTemplate: {
              quantity: 10,
              maxTicketsPerUser: 3,
              isFree: true,
            },
          }),
          insertUser(),
          insertUser(),
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
      const { ticketTemplate, user } = await createTestSetup({
        ticketTemplate: {
          quantity: totalTickets,
          maxTicketsPerUser: totalTickets,
          isFree: true,
        },
      });

      // Purchase exactly the maximum number of tickets
      const response1 = await executeGraphqlOperationAsUser<
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
                  quantity: totalTickets,
                  itemsDetails: [],
                },
              ],
            },
          },
        },
        user,
      );

      assertSuccessfulPurchase({
        response: response1,
        expectedTicketsCount: totalTickets,
      });

      // Attempt to purchase one more ticket
      const response2 = await executeGraphqlOperationAsUser<
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
                  itemsDetails: [],
                },
              ],
            },
          },
        },
        user,
      );

      assertPurchaseError({
        response: response2,
        expectedError: `We have gone over the limit of tickets for ticket template with id ${ticketTemplate.id}`,
      });
    });
  });
});
