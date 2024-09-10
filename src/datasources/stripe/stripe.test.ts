import { faker } from "@faker-js/faker";
import Stripe from "stripe";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { createOrUpdateStripeProductAndPrice } from "~/datasources/stripe";

// Mock Stripe client
const mockStripeClient = {
  products: {
    retrieve: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  prices: {
    create: vi.fn(),
  },
};

const getStripeClient = () => mockStripeClient as unknown as Stripe;

describe("createOrUpdateStripeProductAndPrice", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should create a new product and price when the product doesn't exist", async () => {
    const productId = faker.string.uuid();
    const priceId = faker.string.uuid();

    // Mock product doesn't exist
    mockStripeClient.products.retrieve.mockRejectedValueOnce(
      new Stripe.errors.StripeError({
        type: "invalid_request_error",
        code: "resource_missing",
        message: "No such product",
      }),
    );

    // Mock product creation
    mockStripeClient.products.create.mockResolvedValueOnce({
      id: productId,
      default_price: priceId,
    });

    const result = await createOrUpdateStripeProductAndPrice({
      item: {
        id: productId,
        name: "Test Product",
        description: "Test Description",
        currency: "USD",
        unit_amount: 1000,
      },
      getStripeClient,
    });

    expect(result).toBe(priceId);

    expect(mockStripeClient.products.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: productId,
        name: "Test Product",
        description: "Test Description",
        default_price_data: {
          currency: "USD",
          unit_amount: 1000,
        },
      }),
    );
  });

  it("should update an existing product and create a new price when needed", async () => {
    const productId = faker.string.uuid();
    const oldPriceId = faker.string.uuid();
    const newPriceId = faker.string.uuid();

    // Mock existing product
    mockStripeClient.products.retrieve.mockResolvedValueOnce({
      id: productId,
      name: "Old Name",
      description: "Old Description",
      default_price: {
        id: oldPriceId,
        currency: "USD",
        unit_amount: 500,
      },
    });

    // Mock price creation
    mockStripeClient.prices.create.mockResolvedValueOnce({ id: newPriceId });

    const result = await createOrUpdateStripeProductAndPrice({
      item: {
        id: productId,
        name: "New Name",
        description: "New Description",
        currency: "USD",
        unit_amount: 1000,
      },
      getStripeClient,
    });

    expect(result).toBe(newPriceId);

    expect(mockStripeClient.products.update).toHaveBeenCalledWith(
      productId,
      expect.objectContaining({
        name: "New Name",
        description: "New Description",
      }),
    );

    expect(mockStripeClient.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        product: productId,
        currency: "USD",
        unit_amount: 1000,
      }),
    );

    expect(mockStripeClient.products.update).toHaveBeenCalledWith(productId, {
      default_price: newPriceId,
    });
  });
});
