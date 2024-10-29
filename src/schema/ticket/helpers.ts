import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { TRANSACTION_HANDLER } from "~/datasources/db";
import { ticketsSchema } from "~/datasources/db/schema";
import { createOrUpdateStripeProductAndPrice } from "~/datasources/stripe";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";

export const ensureProductsAreCreated = async ({
  currency,
  getStripeClient,
  tickets,
  transactionHandler,
  logger,
}: {
  currency: {
    id: string;
    currency: string;
  };
  tickets: {
    id: string;
    name: string;
    description?: string | null;
    isFree: boolean;
    stripeProductId: string | null;
    price: {
      amount: number;
    } | null;
  }[];
  getStripeClient: () => Stripe;
  transactionHandler: TRANSACTION_HANDLER;
  logger: Logger;
}) => {
  if (currency.currency === "USD") {
    const stripeTicketsItems = tickets
      .map((ticket) => {
        if (ticket.isFree) {
          return null;
        }

        if (!ticket.price) {
          throw applicationError(
            `ensureProductsAreCreated: Ticket template with id ${ticket.id} does not have a price`,
            ServiceErrors.INTERNAL_SERVER_ERROR,
            logger,
          );
        }

        return {
          id: ticket.id,
          stripeId: `ticket-${ticket.id}`,
          currency: currency.currency,
          name: ticket.name,
          description: ticket.description ?? undefined,
          unit_amount: ticket.price.amount,
        };
      })
      .filter(Boolean);

    const stripeTicketsTasks = stripeTicketsItems.map(async (ticketItem) => {
      const stripeProductId = await createOrUpdateStripeProductAndPrice({
        item: ticketItem,
        getStripeClient,
      });

      return {
        id: ticketItem.id,
        stripeProductId,
      };
    });

    const updatedStripeProducts = await Promise.all(stripeTicketsTasks);

    const ticketUpdatePromises = updatedStripeProducts.map(
      ({ id, stripeProductId }) =>
        transactionHandler
          .update(ticketsSchema)
          .set({ stripeProductId })
          .where(eq(ticketsSchema.id, id))
          .returning({
            id: ticketsSchema.id,
            stripeProductId: ticketsSchema.stripeProductId,
          })
          .then((updatedTickets) => updatedTickets[0]),
    );

    const updatedTickets = await Promise.all(ticketUpdatePromises);

    return {
      tickets: tickets.map((ticket) => ({
        ...ticket,
        stripeProductId:
          updatedTickets.find((updatedTicket) => updatedTicket.id === ticket.id)
            ?.stripeProductId || null,
      })),
    };
  }

  return {
    tickets,
  };
};
