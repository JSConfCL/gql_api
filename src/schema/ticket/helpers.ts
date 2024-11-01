import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { TRANSACTION_HANDLER } from "~/datasources/db";
import { ticketsSchema, addonsSchema } from "~/datasources/db/schema";
import {
  createOrUpdateStripeProductAndPrice,
  CreateOrUpdateStripeProductItem,
} from "~/datasources/stripe";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";

type ProductInfo = {
  id: string;
  name: string;
  description?: string | null;
  isFree: boolean;
  stripeProductId: string | null;
  price: {
    amount: number;
  } | null;
};

type EnsureProductsAreCreatedArgs = {
  currency: {
    id: string;
    currency: string;
  };
  tickets: ProductInfo[];
  addons: ProductInfo[];
  getStripeClient: () => Stripe;
  transactionHandler: TRANSACTION_HANDLER;
  logger: Logger;
};

type ProcessProductsArgs = {
  products: ProductInfo[];
  productType: "ticket" | "addon";
  args: EnsureProductsAreCreatedArgs;
};

/**
 * Ensures all products are properly created and synchronized with the payment platform
 */
export const ensureProductsAreCreated = async (
  args: EnsureProductsAreCreatedArgs,
) => {
  const { currency, tickets, addons } = args;

  if (currency.currency === "USD") {
    return {
      tickets: await processProducts({
        products: tickets,
        productType: "ticket",
        args,
      }),
      addons: await processProducts({
        products: addons,
        productType: "addon",
        args,
      }),
    };
  }

  return { tickets, addons };
};

/**
 * Processes a batch of products by:
 * 1. Converting them to Stripe format
 * 2. Creating/updating them in Stripe
 * 3. Updating local database with Stripe IDs
 */
const processProducts = async ({
  products,
  productType,
  args,
}: ProcessProductsArgs) => {
  const { currency, getStripeClient, transactionHandler, logger } = args;

  // Convert products to Stripe format, filtering out free products
  const stripeItems = products
    .map((product) =>
      productInfoToStripeItem(product, currency.currency, productType, logger),
    )
    .filter(Boolean);

  // Create or update products in Stripe
  const updatedStripeProducts = await Promise.all(
    stripeItems.map(async (item) => {
      const stripeProductId = await createOrUpdateStripeProductAndPrice({
        item,
        getStripeClient,
      });

      return { id: item.id, stripeProductId };
    }),
  );

  // Update database with new Stripe IDs
  let schema: typeof ticketsSchema | typeof addonsSchema;

  if (productType === "ticket") {
    schema = ticketsSchema;
  } else {
    schema = addonsSchema;
  }

  const updatePromises = updatedStripeProducts.map(({ id, stripeProductId }) =>
    transactionHandler
      .update(schema)
      .set({ stripeProductId })
      .where(eq(schema.id, id))
      .returning({
        id: schema.id,
        stripeProductId: schema.stripeProductId,
      })
      .then((updated) => updated[0]),
  );

  const updatedProducts = await Promise.all(updatePromises);

  // Merge updates back into original products
  return products.map((product) => ({
    ...product,
    stripeProductId:
      updatedProducts.find((updated) => updated.id === product.id)
        ?.stripeProductId || null,
  }));
};

/**
 * Converts a product to Stripe format
 * Returns null for free products
 * Throws error if paid product has no price
 */
const productInfoToStripeItem = (
  product: ProductInfo,
  currencyCode: string,
  productType: "ticket" | "addon",
  logger: Logger,
):
  | (CreateOrUpdateStripeProductItem & {
      id: string;
    })
  | null => {
  if (product.isFree) {
    return null;
  }

  if (!product.price) {
    throw applicationError(
      `ensureProductsAreCreated: ${productType} with id ${product.id} does not have a price`,
      ServiceErrors.INTERNAL_SERVER_ERROR,
      logger,
    );
  }

  return {
    id: product.id,
    stripeId: `${productType}-${product.id}`,
    currency: currencyCode,
    name: product.name,
    description: product.description ?? undefined,
    unit_amount: product.price.amount,
  };
};
