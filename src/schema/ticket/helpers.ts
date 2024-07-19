import { eq } from "drizzle-orm";
import { Logger } from "pino";
import Stripe from "stripe";

import { TRANSACTION_HANDLER } from "~/datasources/db";
import { selectTicketSchema, ticketsSchema } from "~/datasources/db/schema";
import { createStripeProductAndPrice } from "~/datasources/stripe";

export const ensureProductsAreCreated = async ({
  price,
  currencyCode,
  getStripeClient,
  ticket,
  transactionHander,
  logger,
}: {
  price: number;
  currencyCode: string;
  ticket: typeof selectTicketSchema._type;
  getStripeClient: () => Stripe;
  transactionHander: TRANSACTION_HANDLER;
  logger: Logger<never>;
}) => {
  if (currencyCode === "USD") {
    const stripeProductId = await createStripeProductAndPrice({
      item: {
        id: ticket.id,
        name: ticket.name,
        description: ticket.description ?? undefined,
        currency: currencyCode,
        unit_amount: price,
      },
      getStripeClient,
    });

    await transactionHander
      .update(ticketsSchema)
      .set({
        stripeProductId,
      })
      .where(eq(ticketsSchema.id, ticket.id))
      .returning();
    logger.info(
      `Ticket ${ticket.id} updated with stripe ProductId ${stripeProductId}`,
    );
  }

  if (currencyCode === "CLP") {
    // TODO: createMercadoPagoProduct
  }
};
