import { GraphQLError } from "graphql";
import { PreferenceResponse } from "mercadopago/dist/clients/preference/commonTypes";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { ORM_TYPE } from "~/datasources/db";
import { createMercadoPagoPayment } from "~/datasources/mercadopago";
import { getStripeClient } from "~/datasources/stripe/client";
import { Logger } from "~/logging";
import {
  insertAllowedCurrency,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertPrice,
  insertPurchaseOrder,
  insertTicket,
  insertTicketPrice,
  insertTicketTemplate,
  insertUser,
  insertAddon,
  insertAddonPrice,
  insertUserTicketAddon,
  SAMPLE_TEST_UUID,
} from "~/tests/fixtures";
import { getTestDB } from "~/tests/fixtures/databaseHelper";

import * as ticketHelpers from "../../ticket/helpers";
import { handlePaymentLinkGeneration } from "../actions";

describe("handlePaymentLinkGeneration", () => {
  let testDb: ORM_TYPE;
  let logger: Logger;

  beforeEach(async () => {
    testDb = await getTestDB();

    logger = new Logger("test");

    vi.resetAllMocks();
  });

  it("should generate a payment link for a valid purchase order", async () => {
    const user = await insertUser();
    const community = await insertCommunity();
    const event = await insertEvent({ status: "active" });

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });
    const ticketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: false,
    });
    const currency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });
    const price = await insertPrice({
      price_in_cents: 1000,
      currencyId: currency.id,
    });

    await insertTicketPrice({ priceId: price.id, ticketId: ticketTemplate.id });
    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    const mockStripeClient = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "stripe_payment_id",
            url: "https://stripe.com/pay",
            status: "unpaid",
            expires_at: Date.now() + 3600000,
            amount_total: 1000,
          }),
        },
      },
      products: {
        retrieve: vi.fn().mockResolvedValue({
          id: "stripe_product_id",
          default_price: {
            id: "stripe_price_id",
            unit_amount: 1000,
            currency: "usd",
          },
        }),
      },
    } as unknown as ReturnType<typeof getStripeClient>;

    // Mock the ensureProductsAreCreated function
    const mockEnsureProductsAreCreated = vi.spyOn(
      ticketHelpers,
      "ensureProductsAreCreated",
    );

    mockEnsureProductsAreCreated.mockResolvedValue({
      addons: [],
      tickets: [
        {
          ...ticketTemplate,
          price: { amount: price.price_in_cents },
          stripeProductId: "stripe_product_id",
        },
      ],
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: purchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: () => mockStripeClient,
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(result.purchaseOrder.paymentPlatform).toBe("stripe");

    expect(result.purchaseOrder.paymentPlatformPaymentLink).toBe(
      "https://stripe.com/pay",
    );

    expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalled();

    expect(result.purchaseOrder.status).toBe("open");

    expect(result.purchaseOrder.purchaseOrderPaymentStatus).toBe("unpaid");
  });

  it("should throw an error if purchase order is not found", async () => {
    const user = await insertUser();

    await expect(
      handlePaymentLinkGeneration({
        DB: testDb,
        USER: user,
        purchaseOrderId: SAMPLE_TEST_UUID,
        currencyId: SAMPLE_TEST_UUID,
        GET_MERCADOPAGO_CLIENT: vi.fn(),
        GET_STRIPE_CLIENT: vi.fn(),
        paymentSuccessRedirectURL: "http://success.com",
        paymentCancelRedirectURL: "http://cancel.com",
        logger: logger,
      }),
    ).rejects.toThrow("Orden de compra no encontrada");
  });

  it("should throw an error if currency is not found", async () => {
    const user = await insertUser();
    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    await expect(
      handlePaymentLinkGeneration({
        DB: testDb,
        USER: user,
        purchaseOrderId: purchaseOrder.id,
        currencyId: SAMPLE_TEST_UUID, // Use a valid UUID format
        GET_MERCADOPAGO_CLIENT: vi.fn(),
        GET_STRIPE_CLIENT: vi.fn(),
        paymentSuccessRedirectURL: "http://success.com",
        paymentCancelRedirectURL: "http://cancel.com",
        logger: logger,
      }),
    ).rejects.toThrow("No encontramos un currency con el id");
  });

  it("should throw an error if purchase order is already paid", async () => {
    const user = await insertUser();
    const currency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });
    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "complete",
      purchaseOrderPaymentStatus: "paid",
    });

    await expect(
      handlePaymentLinkGeneration({
        DB: testDb,
        USER: user,
        purchaseOrderId: purchaseOrder.id,
        currencyId: currency.id,
        GET_MERCADOPAGO_CLIENT: vi.fn(),
        GET_STRIPE_CLIENT: vi.fn(),
        paymentSuccessRedirectURL: "http://success.com",
        paymentCancelRedirectURL: "http://cancel.com",
        logger: logger,
      }),
    ).rejects.toThrow(GraphQLError);
  });

  it("should handle free tickets correctly", async () => {
    const user = await insertUser();
    const event = await insertEvent({ status: "active" });
    const ticketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: true,
    });
    const currency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });
    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: purchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: vi.fn(),
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(result.purchaseOrder.status).toBe("complete");

    expect(result.purchaseOrder.purchaseOrderPaymentStatus).toBe(
      "not_required",
    );
  });

  it("should create a MercadoPago payment intent for CLP currency", async () => {
    const user = await insertUser();
    const event = await insertEvent({ status: "active" });
    const ticketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: false,
    });
    const currency = await insertAllowedCurrency({
      currency: "CLP",
      validPaymentMethods: "mercado_pago",
    });
    const price = await insertPrice({
      price_in_cents: 1000,
      currencyId: currency.id,
    });

    await insertTicketPrice({ priceId: price.id, ticketId: ticketTemplate.id });
    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    const mockEnsureProductsAreCreated = vi.spyOn(
      ticketHelpers,
      "ensureProductsAreCreated",
    );

    mockEnsureProductsAreCreated.mockResolvedValue({
      addons: [],
      tickets: [
        {
          ...ticketTemplate,
          stripeProductId: "stripe_product_id",
          price: { amount: price.price_in_cents },
        },
      ],
    });

    // Mock the createMercadoPagoPayment function
    vi.mock("~/datasources/mercadopago");

    const mockPreference = {
      id: "mock_preference_id",
      init_point: "https://www.mercadopago.com/mock_init_point",
    } as PreferenceResponse;

    const mockExpirationDate = new Date(Date.now() + 3600000);

    vi.mocked(createMercadoPagoPayment).mockResolvedValue({
      preference: mockPreference,
      expirationDate: mockExpirationDate.toISOString(),
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: purchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: vi.fn(),
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(createMercadoPagoPayment).toHaveBeenCalled();

    expect(result.purchaseOrder.paymentPlatform).toBe("mercadopago");

    expect(result.purchaseOrder.paymentPlatformPaymentLink).toBe(
      mockPreference.init_point,
    );

    expect(result.purchaseOrder.paymentPlatformReferenceID).toBe(
      mockPreference.id,
    );

    expect(result.purchaseOrder.paymentPlatformStatus).toBe("none");

    expect(result.purchaseOrder.paymentPlatformExpirationDate).toEqual(
      mockExpirationDate,
    );

    expect(mockEnsureProductsAreCreated).toHaveBeenCalled();
  });

  it("should mark payment as not required for unsupported currency with no associated tickets", async () => {
    const user = await insertUser();
    const currency = await insertAllowedCurrency({
      currency: "EUR",
      validPaymentMethods: undefined,
    });
    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: purchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: vi.fn(),
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(result.purchaseOrder.purchaseOrderPaymentStatus).toBe(
      "not_required",
    );

    expect(result.purchaseOrder.status).toBe("complete");
  });

  it("should handle a mix of free and paid tickets correctly", async () => {
    const user = await insertUser();
    const event = await insertEvent({ status: "active" });
    const freeTicketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 50,
      isFree: true,
    });
    const paidTicketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 50,
      isFree: false,
    });
    const currency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });
    const price = await insertPrice({
      price_in_cents: 1000,
      currencyId: currency.id,
    });

    await insertTicketPrice({
      priceId: price.id,
      ticketId: paidTicketTemplate.id,
    });
    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    await insertTicket({
      ticketTemplateId: freeTicketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    await insertTicket({
      ticketTemplateId: paidTicketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    const mockStripeClient = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "stripe_payment_id",
            url: "https://stripe.com/pay",
            status: "unpaid",
            expires_at: Date.now() + 3600000,
            amount_total: 1000,
          }),
        },
      },
    } as unknown as ReturnType<typeof getStripeClient>;

    vi.spyOn(ticketHelpers, "ensureProductsAreCreated").mockResolvedValue({
      addons: [],
      tickets: [
        {
          ...paidTicketTemplate,
          price: { amount: price.price_in_cents },
          stripeProductId: "stripe_product_id",
        },
        {
          ...freeTicketTemplate,
          price: { amount: 0 },
          stripeProductId: "free_product_id",
        },
      ],
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: purchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: () => mockStripeClient,
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(result.purchaseOrder.paymentPlatform).toBe("stripe");

    expect(result.purchaseOrder.paymentPlatformPaymentLink).toBe(
      "https://stripe.com/pay",
    );

    expect(result.purchaseOrder.status).toBe("open");

    expect(result.purchaseOrder.purchaseOrderPaymentStatus).toBe("unpaid");
  });

  it("should handle a purchase order with no tickets", async () => {
    const user = await insertUser();
    const currency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });
    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: purchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: vi.fn(),
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(result.purchaseOrder.status).toBe("complete");

    expect(result.purchaseOrder.purchaseOrderPaymentStatus).toBe(
      "not_required",
    );
  });

  it("should throw an error if the currency's payment method is not supported", async () => {
    const user = await insertUser();
    const event = await insertEvent({ status: "active" });
    const ticketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 50,
      isFree: false,
    });
    const currency = await insertAllowedCurrency({
      currency: "GBP",
      validPaymentMethods: undefined,
    });
    const price = await insertPrice({
      price_in_cents: 1000,
      currencyId: currency.id,
    });

    await insertTicketPrice({ priceId: price.id, ticketId: ticketTemplate.id });
    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    const mockEnsureProductsAreCreated = vi.spyOn(
      ticketHelpers,
      "ensureProductsAreCreated",
    );

    mockEnsureProductsAreCreated.mockResolvedValue({
      addons: [],
      tickets: [
        {
          ...ticketTemplate,
          price: { amount: price.price_in_cents },
          stripeProductId: "stripe_product_id",
        },
      ],
    });

    await expect(
      handlePaymentLinkGeneration({
        DB: testDb,
        USER: user,
        purchaseOrderId: purchaseOrder.id,
        currencyId: currency.id,
        GET_MERCADOPAGO_CLIENT: vi.fn(),
        GET_STRIPE_CLIENT: vi.fn(),
        paymentSuccessRedirectURL: "http://success.com",
        paymentCancelRedirectURL: "http://cancel.com",
        logger: logger,
      }),
    ).rejects.toThrow("Unsupported currency");
  });

  it("should generate a payment link for a valid purchase order with tickets and addons", async () => {
    const user = await insertUser();
    const community = await insertCommunity();
    const event = await insertEvent({ status: "active" });

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });
    const ticketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: false,
    });
    const currency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });
    const ticketPrice = await insertPrice({
      price_in_cents: 1000,
      currencyId: currency.id,
    });

    await insertTicketPrice({
      priceId: ticketPrice.id,
      ticketId: ticketTemplate.id,
    });

    // Create an addon
    const addon = await insertAddon({
      eventId: event.id,
      name: "VIP Access",
      description: "VIP access to the event",
      isFree: false,
    });
    const addonPrice = await insertPrice({
      price_in_cents: 500,
      currencyId: currency.id,
    });

    await insertAddonPrice({ priceId: addonPrice.id, addonId: addon.id });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    // Insert two tickets
    const userTicket1 = await insertTicket({
      ticketTemplateId: ticketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    const userTicket2 = await insertTicket({
      ticketTemplateId: ticketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    // Insert user ticket addons with different quantities
    await insertUserTicketAddon({
      addonId: addon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: userTicket1.id,
      unitPriceInCents: addonPrice.price_in_cents,
      quantity: 2,
    });

    await insertUserTicketAddon({
      addonId: addon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: userTicket2.id,
      unitPriceInCents: addonPrice.price_in_cents,
      quantity: 1,
    });

    const mockStripeClient = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "stripe_payment_id",
            url: "https://stripe.com/pay",
            status: "unpaid",
            expires_at: Date.now() + 3600000,
            amount_total: 3500, // 2 * 1000 (tickets) + 3 * 500 (addons)
          }),
        },
      },
      products: {
        retrieve: vi.fn().mockResolvedValue({
          id: "stripe_product_id",
          default_price: {
            id: "stripe_price_id",
            unit_amount: 3500,
            currency: "usd",
          },
        }),
      },
    } as unknown as ReturnType<typeof getStripeClient>;

    // Mock the ensureProductsAreCreated function
    const mockEnsureProductsAreCreated = vi.spyOn(
      ticketHelpers,
      "ensureProductsAreCreated",
    );

    mockEnsureProductsAreCreated.mockResolvedValue({
      tickets: [
        {
          ...ticketTemplate,
          price: { amount: ticketPrice.price_in_cents },
          stripeProductId: "stripe_ticket_product_id",
        },
      ],
      addons: [
        {
          ...addon,
          price: { amount: addonPrice.price_in_cents },
          stripeProductId: "stripe_addon_product_id",
        },
      ],
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: purchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: () => mockStripeClient,
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(result.purchaseOrder.paymentPlatform).toBe("stripe");

    expect(result.purchaseOrder.paymentPlatformPaymentLink).toBe(
      "https://stripe.com/pay",
    );

    expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalled();

    expect(result.purchaseOrder.status).toBe("open");

    expect(result.purchaseOrder.purchaseOrderPaymentStatus).toBe("unpaid");

    expect(result.purchaseOrder.totalPrice).toBe("3500");
    // Check that the correct items and quantities were passed to Stripe
    const createSessionCall = (
      mockStripeClient.checkout.sessions.create as Mock
    ).mock.calls[0][0] as {
      line_items: Array<{ price: string; quantity: number }>;
    };

    expect(createSessionCall.line_items).toEqual([
      { price: "stripe_ticket_product_id", quantity: 2 },
      { price: "stripe_addon_product_id", quantity: 3 },
    ]);
  });

  it("should handle a mix of free and paid tickets with addons correctly", async () => {
    const user = await insertUser();
    const event = await insertEvent({ status: "active" });
    const freeTicketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 50,
      isFree: true,
    });
    const paidTicketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 50,
      isFree: false,
    });
    const currency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });
    const ticketPrice = await insertPrice({
      price_in_cents: 1000,
      currencyId: currency.id,
    });

    await insertTicketPrice({
      priceId: ticketPrice.id,
      ticketId: paidTicketTemplate.id,
    });

    // Create a paid addon
    const paidAddon = await insertAddon({
      eventId: event.id,
      name: "VIP Access",
      description: "VIP access to the event",
      isFree: false,
    });
    const paidAddonPrice = await insertPrice({
      price_in_cents: 500,
      currencyId: currency.id,
    });

    await insertAddonPrice({
      priceId: paidAddonPrice.id,
      addonId: paidAddon.id,
    });

    // Create a free addon
    const freeAddon = await insertAddon({
      eventId: event.id,
      name: "Free Gift",
      description: "A free gift for attendees",
      isFree: true,
    });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    await insertTicket({
      ticketTemplateId: freeTicketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    const userTicket = await insertTicket({
      ticketTemplateId: paidTicketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    // Insert user ticket addons
    await insertUserTicketAddon({
      addonId: paidAddon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: userTicket.id,
      unitPriceInCents: paidAddonPrice.price_in_cents,
    });

    await insertUserTicketAddon({
      addonId: freeAddon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: userTicket.id,
      unitPriceInCents: 0,
    });

    const mockStripeClient = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "stripe_payment_id",
            url: "https://stripe.com/pay",
            status: "unpaid",
            expires_at: Date.now() + 3600000,
            amount_total: 1500, // 1000 (paid ticket) + 500 (paid addon)
          }),
        },
      },
    } as unknown as ReturnType<typeof getStripeClient>;

    vi.spyOn(ticketHelpers, "ensureProductsAreCreated").mockResolvedValue({
      tickets: [
        {
          ...paidTicketTemplate,
          price: { amount: ticketPrice.price_in_cents },
          stripeProductId: "stripe_paid_ticket_product_id",
        },
        {
          ...freeTicketTemplate,
          price: { amount: 0 },
          stripeProductId: "stripe_free_ticket_product_id",
        },
      ],
      addons: [
        {
          ...paidAddon,
          price: { amount: paidAddonPrice.price_in_cents },
          stripeProductId: "stripe_paid_addon_product_id",
        },
        {
          ...freeAddon,
          price: { amount: 0 },
          stripeProductId: "stripe_free_addon_product_id",
        },
      ],
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: purchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: () => mockStripeClient,
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(result.purchaseOrder.paymentPlatform).toBe("stripe");

    expect(result.purchaseOrder.paymentPlatformPaymentLink).toBe(
      "https://stripe.com/pay",
    );

    expect(result.purchaseOrder.status).toBe("open");

    expect(result.purchaseOrder.purchaseOrderPaymentStatus).toBe("unpaid");

    expect(result.purchaseOrder.totalPrice).toBe("1500");
  });

  it("should generate a payment link for a purchase order with only addons if the user ticket is already paid", async () => {
    const user = await insertUser();
    const event = await insertEvent({ status: "active" });
    const currency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });

    // Create a paid addon
    const addon = await insertAddon({
      eventId: event.id,
      name: "VIP Access",
      description: "VIP access to the event",
      isFree: false,
    });
    const addonPrice = await insertPrice({
      price_in_cents: 2000,
      currencyId: currency.id,
    });

    await insertAddonPrice({ priceId: addonPrice.id, addonId: addon.id });

    const ticketPaidPurchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "complete",
      purchaseOrderPaymentStatus: "paid",
    });

    const ticketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: false,
    });

    const userTicket = await insertTicket({
      ticketTemplateId: ticketTemplate.id,
      purchaseOrderId: ticketPaidPurchaseOrder.id,
      userId: user.id,
    });

    const addonPurchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    // Insert a user ticket addon without an associated ticket
    await insertUserTicketAddon({
      addonId: addon.id,
      purchaseOrderId: addonPurchaseOrder.id,
      userTicketId: userTicket.id,
      unitPriceInCents: addonPrice.price_in_cents,
    });

    const mockStripeClient = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "stripe_payment_id",
            url: "https://stripe.com/pay",
            status: "unpaid",
            expires_at: Date.now() + 3600000,
            amount_total: 2000,
          }),
        },
      },
    } as unknown as ReturnType<typeof getStripeClient>;

    // Mock the ensureProductsAreCreated function
    const mockEnsureProductsAreCreated = vi.spyOn(
      ticketHelpers,
      "ensureProductsAreCreated",
    );

    mockEnsureProductsAreCreated.mockResolvedValue({
      tickets: [],
      addons: [
        {
          ...addon,
          price: { amount: addonPrice.price_in_cents },
          stripeProductId: "stripe_addon_product_id",
        },
      ],
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: addonPurchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: () => mockStripeClient,
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(result.purchaseOrder.paymentPlatform).toBe("stripe");

    expect(result.purchaseOrder.paymentPlatformPaymentLink).toBe(
      "https://stripe.com/pay",
    );

    expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalled();

    expect(result.purchaseOrder.status).toBe("open");

    expect(result.purchaseOrder.purchaseOrderPaymentStatus).toBe("unpaid");

    expect(result.purchaseOrder.totalPrice).toBe("2000");
  });

  it("should create a MercadoPago payment intent for CLP currency with correct quantities", async () => {
    const user = await insertUser();
    const event = await insertEvent({ status: "active" });
    const ticketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: false,
    });
    const currency = await insertAllowedCurrency({
      currency: "CLP",
      validPaymentMethods: "mercado_pago",
    });
    const price = await insertPrice({
      price_in_cents: 1000,
      currencyId: currency.id,
    });

    await insertTicketPrice({ priceId: price.id, ticketId: ticketTemplate.id });

    // Create an addon
    const addon = await insertAddon({
      eventId: event.id,
      name: "VIP Access",
      description: "VIP access to the event",
      isFree: false,
    });
    const addonPrice = await insertPrice({
      price_in_cents: 500,
      currencyId: currency.id,
    });

    await insertAddonPrice({ priceId: addonPrice.id, addonId: addon.id });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    // Insert two tickets
    const userTicket1 = await insertTicket({
      ticketTemplateId: ticketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    const userTicket2 = await insertTicket({
      ticketTemplateId: ticketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    // Insert user ticket addons with different quantities
    await insertUserTicketAddon({
      addonId: addon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: userTicket1.id,
      unitPriceInCents: addonPrice.price_in_cents,
      quantity: 2,
    });

    await insertUserTicketAddon({
      addonId: addon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: userTicket2.id,
      unitPriceInCents: addonPrice.price_in_cents,
      quantity: 1,
    });

    const mockEnsureProductsAreCreated = vi.spyOn(
      ticketHelpers,
      "ensureProductsAreCreated",
    );

    mockEnsureProductsAreCreated.mockResolvedValue({
      addons: [
        {
          ...addon,
          price: { amount: addonPrice.price_in_cents },
        },
      ],
      tickets: [
        {
          ...ticketTemplate,
          price: { amount: price.price_in_cents },
        },
      ],
    });

    // Mock the createMercadoPagoPayment function
    vi.mock("~/datasources/mercadopago");

    const mockPreference = {
      id: "mock_preference_id",
      init_point: "https://www.mercadopago.com/mock_init_point",
    } as PreferenceResponse;

    const mockExpirationDate = new Date(Date.now() + 3600000);

    vi.mocked(createMercadoPagoPayment).mockResolvedValue({
      preference: mockPreference,
      expirationDate: mockExpirationDate.toISOString(),
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: purchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: vi.fn(),
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(createMercadoPagoPayment).toHaveBeenCalled();

    expect(result.purchaseOrder.paymentPlatform).toBe("mercadopago");

    expect(result.purchaseOrder.paymentPlatformPaymentLink).toBe(
      mockPreference.init_point,
    );

    expect(result.purchaseOrder.paymentPlatformReferenceID).toBe(
      mockPreference.id,
    );

    expect(result.purchaseOrder.paymentPlatformStatus).toBe("none");

    expect(result.purchaseOrder.paymentPlatformExpirationDate).toEqual(
      mockExpirationDate,
    );

    expect(result.purchaseOrder.totalPrice).toBe("3500");

    // Check that the correct items and quantities were passed to MercadoPago
    const createPaymentCall = vi.mocked(createMercadoPagoPayment).mock
      .calls[0][0];

    expect(createPaymentCall.items).toEqual([
      {
        id: ticketTemplate.id,
        unit_price: 1000,
        title: ticketTemplate.name,
        description: ticketTemplate.description ?? undefined,
        quantity: 2,
      },
      {
        id: addon.id,
        unit_price: 500,
        title: addon.name,
        description: addon.description ?? undefined,
        quantity: 3,
      },
    ]);

    expect(mockEnsureProductsAreCreated).toHaveBeenCalled();
  });

  it("should correctly set a a payment link for a valid purchase order with a mix of free and paid tickets and addons", async () => {
    const user = await insertUser();
    const event = await insertEvent({ status: "active" });
    const paidTicketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: false,
      name: "Paid Ticket",
    });
    const freeTicketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: true,
      name: "Free Ticket",
    });
    const currency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });
    const ticketPrice = await insertPrice({
      price_in_cents: 1000,
      currencyId: currency.id,
    });

    await insertTicketPrice({
      priceId: ticketPrice.id,
      ticketId: paidTicketTemplate.id,
    });

    // Create a paid addon
    const paidAddon = await insertAddon({
      eventId: event.id,
      name: "VIP Access",
      description: "VIP access to the event",
      isFree: false,
    });
    const addonPrice = await insertPrice({
      price_in_cents: 500,
      currencyId: currency.id,
    });

    await insertAddonPrice({ priceId: addonPrice.id, addonId: paidAddon.id });

    // Create a free addon
    const freeAddon = await insertAddon({
      eventId: event.id,
      name: "Free Gift",
      description: "A free gift for attendees",
      isFree: true,
    });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    // Insert tickets
    const paidTicket1 = await insertTicket({
      ticketTemplateId: paidTicketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });
    const paidTicket2 = await insertTicket({
      ticketTemplateId: paidTicketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });
    const freeTicket = await insertTicket({
      ticketTemplateId: freeTicketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    // Insert user ticket addons with different quantities
    await insertUserTicketAddon({
      addonId: paidAddon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: paidTicket1.id,
      unitPriceInCents: addonPrice.price_in_cents,
      quantity: 2,
    });

    await insertUserTicketAddon({
      addonId: paidAddon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: paidTicket2.id,
      unitPriceInCents: addonPrice.price_in_cents,
      quantity: 1,
    });

    await insertUserTicketAddon({
      addonId: freeAddon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: freeTicket.id,
      unitPriceInCents: 0,
      quantity: 3,
    });

    const mockStripeClient = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "stripe_payment_id",
            url: "https://stripe.com/pay",
            status: "unpaid",
            expires_at: Date.now() + 3600000,
            amount_total: 3500, // 2 * 1000 (paid tickets) + 3 * 500 (paid addons)
          }),
        },
      },
      products: {
        retrieve: vi.fn().mockResolvedValue({
          id: "stripe_product_id",
          default_price: {
            id: "stripe_price_id",
            unit_amount: 3500,
            currency: "usd",
          },
        }),
      },
    } as unknown as ReturnType<typeof getStripeClient>;

    // Mock the ensureProductsAreCreated function
    const mockEnsureProductsAreCreated = vi.spyOn(
      ticketHelpers,
      "ensureProductsAreCreated",
    );

    mockEnsureProductsAreCreated.mockResolvedValue({
      tickets: [
        {
          ...paidTicketTemplate,
          price: { amount: ticketPrice.price_in_cents },
          stripeProductId: "stripe_paid_ticket_product_id",
        },
        {
          ...freeTicketTemplate,
          price: { amount: 0 },
          stripeProductId: "stripe_free_ticket_product_id",
        },
      ],
      addons: [
        {
          ...paidAddon,
          price: { amount: addonPrice.price_in_cents },
          stripeProductId: "stripe_paid_addon_product_id",
        },
        {
          ...freeAddon,
          price: { amount: 0 },
          stripeProductId: "stripe_free_addon_product_id",
        },
      ],
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: purchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: () => mockStripeClient,
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(result.purchaseOrder.paymentPlatform).toBe("stripe");

    expect(result.purchaseOrder.paymentPlatformPaymentLink).toBe(
      "https://stripe.com/pay",
    );

    expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalled();

    expect(result.purchaseOrder.status).toBe("open");

    expect(result.purchaseOrder.purchaseOrderPaymentStatus).toBe("unpaid");

    expect(result.purchaseOrder.totalPrice).toBe("3500");

    // Check that the correct items and quantities were passed to Stripe
    const createSessionCall = (
      mockStripeClient.checkout.sessions.create as Mock
    ).mock.calls[0][0] as {
      line_items: Array<{ price: string; quantity: number }>;
    };

    expect(createSessionCall.line_items).toEqual([
      { price: "stripe_paid_ticket_product_id", quantity: 2 },
      { price: "stripe_paid_addon_product_id", quantity: 3 },
    ]);
  });

  it("should handle amounts and quantities when mixing free and paid tickets and addons", async () => {
    const user = await insertUser();
    const event = await insertEvent({ status: "active" });
    const paidTicketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: false,
      name: "Paid Ticket",
    });
    const freeTicketTemplate = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: true,
      name: "Free Ticket",
    });
    const currency = await insertAllowedCurrency({
      currency: "CLP",
      validPaymentMethods: "mercado_pago",
    });
    const price = await insertPrice({
      price_in_cents: 1000,
      currencyId: currency.id,
    });

    await insertTicketPrice({
      priceId: price.id,
      ticketId: paidTicketTemplate.id,
    });

    // Create a paid addon
    const paidAddon = await insertAddon({
      eventId: event.id,
      name: "VIP Access",
      description: "VIP access to the event",
      isFree: false,
    });
    const addonPrice = await insertPrice({
      price_in_cents: 500,
      currencyId: currency.id,
    });

    await insertAddonPrice({ priceId: addonPrice.id, addonId: paidAddon.id });

    // Create a free addon
    const freeAddon = await insertAddon({
      eventId: event.id,
      name: "Free Gift",
      description: "A free gift for attendees",
      isFree: true,
    });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
    });

    // Insert tickets
    const paidTicket1 = await insertTicket({
      ticketTemplateId: paidTicketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });
    const paidTicket2 = await insertTicket({
      ticketTemplateId: paidTicketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });
    const freeTicket = await insertTicket({
      ticketTemplateId: freeTicketTemplate.id,
      purchaseOrderId: purchaseOrder.id,
      userId: user.id,
    });

    // Insert user ticket addons with different quantities
    await insertUserTicketAddon({
      addonId: paidAddon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: paidTicket1.id,
      unitPriceInCents: addonPrice.price_in_cents,
      quantity: 2,
    });

    await insertUserTicketAddon({
      addonId: paidAddon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: paidTicket2.id,
      unitPriceInCents: addonPrice.price_in_cents,
      quantity: 1,
    });

    await insertUserTicketAddon({
      addonId: freeAddon.id,
      purchaseOrderId: purchaseOrder.id,
      userTicketId: freeTicket.id,
      unitPriceInCents: 0,
      quantity: 3,
    });

    const mockEnsureProductsAreCreated = vi.spyOn(
      ticketHelpers,
      "ensureProductsAreCreated",
    );

    mockEnsureProductsAreCreated.mockResolvedValue({
      addons: [
        {
          ...paidAddon,
          price: { amount: addonPrice.price_in_cents },
        },
        {
          ...freeAddon,
          price: { amount: 0 },
        },
      ],
      tickets: [
        {
          ...paidTicketTemplate,
          price: { amount: price.price_in_cents },
        },
        {
          ...freeTicketTemplate,
          price: { amount: 0 },
        },
      ],
    });

    // Mock the createMercadoPagoPayment function
    vi.mock("~/datasources/mercadopago");

    const mockPreference = {
      id: "mock_preference_id",
      init_point: "https://www.mercadopago.com/mock_init_point",
    } as PreferenceResponse;

    const mockExpirationDate = new Date(Date.now() + 3600000);

    vi.mocked(createMercadoPagoPayment).mockResolvedValue({
      preference: mockPreference,
      expirationDate: mockExpirationDate.toISOString(),
    });

    const result = await handlePaymentLinkGeneration({
      DB: testDb,
      USER: user,
      purchaseOrderId: purchaseOrder.id,
      currencyId: currency.id,
      GET_MERCADOPAGO_CLIENT: vi.fn(),
      GET_STRIPE_CLIENT: vi.fn(),
      paymentSuccessRedirectURL: "http://success.com",
      paymentCancelRedirectURL: "http://cancel.com",
      logger: logger,
    });

    expect(createMercadoPagoPayment).toHaveBeenCalled();

    expect(result.purchaseOrder.paymentPlatform).toBe("mercadopago");

    expect(result.purchaseOrder.paymentPlatformPaymentLink).toBe(
      mockPreference.init_point,
    );

    expect(result.purchaseOrder.paymentPlatformReferenceID).toBe(
      mockPreference.id,
    );

    expect(result.purchaseOrder.paymentPlatformStatus).toBe("none");

    expect(result.purchaseOrder.paymentPlatformExpirationDate).toEqual(
      mockExpirationDate,
    );

    expect(result.purchaseOrder.totalPrice).toBe("3500");

    // Check that the correct items and quantities were passed to MercadoPago
    const createPaymentCall = vi.mocked(createMercadoPagoPayment).mock
      .calls[0][0];

    expect(createPaymentCall.items).toEqual([
      {
        id: paidTicketTemplate.id,
        unit_price: 1000,
        title: paidTicketTemplate.name,
        description: paidTicketTemplate.description ?? undefined,
        quantity: 2,
      },
      {
        id: paidAddon.id,
        unit_price: 500,
        title: paidAddon.name,
        description: paidAddon.description ?? undefined,
        quantity: 3,
      },
    ]);

    expect(mockEnsureProductsAreCreated).toHaveBeenCalled();
  });
});
