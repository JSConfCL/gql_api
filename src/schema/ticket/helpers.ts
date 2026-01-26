import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { TRANSACTION_HANDLER, ORM_TYPE } from "~/datasources/db";
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

export async function validateUserHasRequiredTickets({
  DB,
  userId,
  ticketId,
  logger,
}: {
  DB: ORM_TYPE;
  userId: string;
  ticketId: string;
  logger: Logger;
}): Promise<void> {
  // Get all requirements for this ticket
  const requirements = await DB.query.ticketRequirementsSchema.findMany({
    where: (tr, { eq }) => eq(tr.ticketId, ticketId),
  });

  // If there are no requirements, the user can buy the ticket
  if (requirements.length === 0) {
    return;
  }

  // Get all user tickets that are approved or not requiring approval
  const userTickets = await DB.query.userTicketsSchema.findMany({
    where: (ut, { and, eq, inArray }) =>
      and(
        eq(ut.userId, userId),
        inArray(ut.approvalStatus, [
          "approved",
          "not_required",
          "gift_accepted",
          "transfer_accepted",
        ]),
      ),
  });

  // Create a set of ticket IDs the user owns
  const userTicketIds = new Set(userTickets.map((ut) => ut.ticketTemplateId));

  // Check if user has all required tickets
  const missingTickets = requirements.filter(
    (req) => !userTicketIds.has(req.requiredTicketId),
  );

  if (missingTickets.length > 0) {
    throw applicationError(
      "User does not have all required tickets to purchase this ticket",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }
}
