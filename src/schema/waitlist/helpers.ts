import { ORM_TYPE } from "~/datasources/db";
import {
  selectUserTicketsSchema,
  userTicketsSchema,
} from "~/datasources/db/userTickets";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";
import { createInitialPurchaseOrder } from "~/schema/purchaseOrder/helpers";
import { ticketsFetcher } from "~/schema/ticket/ticketsFetcher";
import { userTicketFetcher } from "~/schema/userTickets/userTicketFetcher";

export const createWaitlistEntry = async ({
  DB,
  ticketId,
  userId,
  logger,
}: {
  DB: ORM_TYPE;
  ticketId: string;
  userId: string;
  logger: Logger;
}) => {
  const tickets = await ticketsFetcher.searchTickets({
    DB,
    search: {
      ticketIds: [ticketId],
      tags: ["waitlist"],
    },
  });

  const ticket = tickets[0];

  if (!ticket) {
    throw applicationError(
      "Could not find a waitlist for the given ticketId",
      ServiceErrors.NOT_FOUND,
      logger,
    );
  }

  const userTickets = await userTicketFetcher.searchUserTickets({
    DB,
    search: {
      userIds: [userId],
      ticketIds: [ticketId],
    },
  });

  if (userTickets.length > 0) {
    throw applicationError(
      "User already applied to waitlist",
      ServiceErrors.ALREADY_EXISTS,
      logger,
    );
  }

  const purchaseOrder = await createInitialPurchaseOrder({
    DB,
    userId,
    logger,
  });

  const waitlistEntry = await DB.insert(userTicketsSchema)
    .values(
      selectUserTicketsSchema.parse({
        ticketTemplateId: ticketId,
        userId,
        purchaseOrderId: purchaseOrder.id,
      }),
    )
    .returning();

  const insertedUserTicket = waitlistEntry[0];

  if (!insertedUserTicket) {
    throw applicationError(
      "Could not create waitlist entry",
      ServiceErrors.INTERNAL_SERVER_ERROR,
      logger,
    );
  }

  return insertedUserTicket;
};
