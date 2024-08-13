import { ORM_TYPE } from "~/datasources/db";
import { USER } from "~/datasources/db/users";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";
import { eventsFetcher } from "~/schema/events/eventsFetcher";
import { ticketsFetcher } from "~/schema/ticket/ticketsFetcher";

export const assertCanStartTicketClaimingForEvent = async ({
  DB,
  user,
  purchaseOrderByTickets,
  logger,
}: {
  DB: ORM_TYPE;
  user: USER;
  purchaseOrderByTickets: Record<
    string,
    {
      ticketId: string;
      quantity: number;
    }
  >;
  logger: Logger;
}) => {
  const ticketIds = Object.keys(purchaseOrderByTickets);
  const events = await eventsFetcher.searchEvents({
    DB,
    search: {
      ticketIds,
    },
  });

  if (events.length > 1) {
    throw applicationError(
      "Multiple events found for tickets. This is not allowed for the time being (We are working on it)",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  const event = events[0];

  if (!event) {
    throw applicationError(
      "No event found for tickets",
      ServiceErrors.NOT_FOUND,
      logger,
    );
  }

  if (event.startDateTime < new Date()) {
    throw applicationError(
      "Event has already started",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  if (event.status === "inactive" && !user.isSuperAdmin) {
    throw applicationError(
      `Event ${event.id} is not active. Cannot claim tickets for an inactive event.`,
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  const tickets = await ticketsFetcher.searchTickets({
    DB,
    search: {
      ticketIds,
    },
  });

  if (tickets.length !== ticketIds.length) {
    throw applicationError(
      "Not all tickets found for event",
      ServiceErrors.NOT_FOUND,
      logger,
    );
  }

  for (const ticket of tickets) {
    if (
      ticket.maxTicketsPerUser &&
      ticket.maxTicketsPerUser < purchaseOrderByTickets[ticket.id].quantity
    ) {
      throw applicationError(
        `You cannot get more ${ticket.maxTicketsPerUser} for ticket ${ticket.id}`,
        ServiceErrors.FAILED_PRECONDITION,
        logger,
      );
    }
  }
};
