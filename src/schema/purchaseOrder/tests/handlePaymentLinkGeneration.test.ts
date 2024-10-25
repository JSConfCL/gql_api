import { GraphQLError } from "graphql";
import { PreferenceResponse } from "mercadopago/dist/clients/preference/commonTypes";
import { describe, it, expect, vi, beforeEach } from "vitest";

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
        purchaseOrderId: "00000000-0000-0000-0000-000000000000",
        currencyId: "00000000-0000-0000-0000-000000000000",
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
        currencyId: "00000000-0000-0000-0000-000000000000", // Use a valid UUID format
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
});
