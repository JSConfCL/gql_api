import { ORM_TYPE } from "~/datasources/db";
import { USER } from "~/datasources/db/users";
import {
  insertUserTicketsEmailLogSchema,
  userTicketsEmailLogSchema,
  UserTicketsEmailType,
} from "~/datasources/db/userTicketsEmailLogs";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";
import { Context } from "~/types";

export const sendAddedToWaitlistEmail = async ({
  DB,
  userTicketId,
  userId,
  RPC_SERVICE_EMAIL,
  logger,
}: {
  DB: ORM_TYPE;
  RPC_SERVICE_EMAIL: Context["RPC_SERVICE_EMAIL"];
  userId: string;
  userTicketId: string;
  logger: Logger;
}) => {
  // We only send if we haven't sent it before
  const waitlist = await DB.query.userTicketsEmailLogSchema.findFirst({
    where: (u, { and, eq }) =>
      and(
        eq(u.userTicketId, userTicketId),
        eq(u.emailType, UserTicketsEmailType.WAITLIST_ENTRY_CREATED),
        eq(u.userId, userId),
      ),
  });

  if (waitlist) {
    return;
  }

  const userTicketInformation = await DB.query.userTicketsSchema.findFirst({
    where: (t, { eq }) => eq(t.id, userTicketId),
    with: {
      user: true,
      ticketTemplate: {
        with: {
          event: true,
        },
      },
    },
  });

  if (!userTicketInformation) {
    throw applicationError(
      `Could not find user, ticket and event information associated to: ${userTicketId}`,
      ServiceErrors.NOT_FOUND,
      logger,
    );
  }

  const { user } = userTicketInformation;

  if (!user) {
    throw applicationError(
      `Could not find user associated to: ${userTicketId}`,
      ServiceErrors.NOT_FOUND,
      logger,
    );
  }

  const userName = user.name ?? undefined;

  await RPC_SERVICE_EMAIL.sendConfirmationYouAreOnTheWaitlist({
    // TODO: Change this image
    ticketName: userTicketInformation.ticketTemplate.event.name,
    ticketId: userTicketInformation.ticketTemplate.event.id,
    userName,
    email: user.email,
  });

  await DB.insert(userTicketsEmailLogSchema).values(
    insertUserTicketsEmailLogSchema.parse({
      emailType: UserTicketsEmailType.WAITLIST_ENTRY_CREATED,
      userTicketId,
      userId,
    }),
  );

  logger.info(`Sent waitlist entry created email to ${user.email}`);
};

export const sendTicketInvitationEmails = async ({
  DB,
  logger,
  userTicketIds,
  RPC_SERVICE_EMAIL,
}: {
  DB: ORM_TYPE;
  logger: Logger;
  userTicketIds: string[];
  RPC_SERVICE_EMAIL: Context["RPC_SERVICE_EMAIL"];
}) => {
  const userTickets = await DB.query.userTicketsSchema.findMany({
    where: (t, { inArray }) => inArray(t.id, userTicketIds),
    with: {
      user: true,
      ticketTemplate: {
        with: {
          event: true,
        },
      },
    },
  });

  const to: {
    name?: string;
    email: string;
    tags: { name: string; value: string }[];
    userTicketId: string;
    ticketName: string;
    ticketId: string;
    eventId: string;
  }[] = [];

  userTickets.forEach((userTicket) => {
    if (!userTicket.user) {
      return null;
    }

    to.push({
      name: userTicket.user.name ?? undefined,
      email: userTicket.user.email,
      ticketName: userTicket.ticketTemplate.name,
      ticketId: userTicket.ticketTemplate.id,
      userTicketId: userTicket.id,
      eventId: userTicket.ticketTemplate.event.id,
      tags: [
        {
          name: "userTicket",
          value: userTicket.id,
        },
        {
          name: "ticketId",
          value: userTicket.ticketTemplate.id,
        },
        {
          name: "eventId",
          value: userTicket.ticketTemplate.event.id,
        },
        {
          name: "userId",
          value: userTicket.user?.id ?? "",
        },
      ],
    });
  });

  await RPC_SERVICE_EMAIL.bulkSendEventTicketInvitations({
    to,
  });
};

export const sendActualUserTicketQREmails = async ({
  DB,
  logger,
  userTicketIds,
  RPC_SERVICE_EMAIL,
}: {
  DB: ORM_TYPE;
  logger: Logger;
  userTicketIds: string[];
  RPC_SERVICE_EMAIL: Context["RPC_SERVICE_EMAIL"];
}) => {
  const userTickets = await DB.query.userTicketsSchema.findMany({
    where: (t, { inArray }) => inArray(t.id, userTicketIds),
    with: {
      user: true,
      ticketTemplate: {
        with: {
          event: true,
        },
      },
    },
  });

  if (userTickets.length === 0) {
    throw applicationError(
      `Could not find ticket and event information associated to: ${userTicketIds.join(
        ", ",
      )}`,
      ServiceErrors.NOT_FOUND,
      logger,
    );
  }

  const to: {
    name?: string;
    email: string;
    tags: { name: string; value: string }[];
    userTicketId: string;
  }[] = [];

  userTickets.forEach((userTicket) => {
    if (!userTicket.user) {
      return null;
    }

    to.push({
      name: userTicket.user.name ?? undefined,
      email: userTicket.user.email,
      userTicketId: userTicket.id,
      tags: [
        {
          name: "userTicket",
          value: userTicket.id,
        },
        {
          name: "ticketId",
          value: userTicket.ticketTemplate.id,
        },
        {
          name: "eventId",
          value: userTicket.ticketTemplate.event.id,
        },
        {
          name: "userId",
          value: userTicket.user.id,
        },
      ],
    });
  });

  await RPC_SERVICE_EMAIL.bulkSendUserQRTicketEmail({
    to,
    ticketName: userTickets[0].ticketTemplate.name,
  });

  const emailLogsValuesToInsert = userTickets.map((someUserTicket) => {
    const next = insertUserTicketsEmailLogSchema.parse({
      emailType: UserTicketsEmailType.TICKET_GIFT_SENT,
      userTicketId: someUserTicket.id,
      userId: someUserTicket.user?.id ?? "",
    });

    return next;
  });

  await DB.insert(userTicketsEmailLogSchema).values(emailLogsValuesToInsert);

  logger.info(
    `Sent "TICKET_GIFT_SENT" email to ${userTickets
      .map((t) => t.user?.email)
      .join(", ")}`,
  );
};
