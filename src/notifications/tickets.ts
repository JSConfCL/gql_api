import { ORM_TYPE } from "~/datasources/db";
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

  const ticketInformation = await DB.query.userTicketsSchema.findFirst({
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

  if (!ticketInformation) {
    throw applicationError(
      `Could not find user, ticket and event information associated to: ${userTicketId}`,
      ServiceErrors.NOT_FOUND,
      logger,
    );
  }

  const { user } = ticketInformation;

  if (!user) {
    throw applicationError(
      `Could not find user associated to: ${userTicketId}`,
      ServiceErrors.NOT_FOUND,
      logger,
    );
  }

  const userName = user.name ?? undefined;

  await RPC_SERVICE_EMAIL.sendEventInvitationsBatch(
    {
      // TODO: Change this image
      eventLogoCloudflareImageURL:
        "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/b6b43de1-d360-4faf-bd7a-7421e8fc1f00",
      eventName: ticketInformation.ticketTemplate.event.name,
      userName,
    },
    [
      {
        email: user.email,
        name: userName,
      },
    ],
  );

  await DB.insert(userTicketsEmailLogSchema).values(
    insertUserTicketsEmailLogSchema.parse({
      emailType: UserTicketsEmailType.WAITLIST_ENTRY_CREATED,
      userTicketId,
    }),
  );

  logger.info(`Sent waitlist entry created email to ${user.email}`);
};
