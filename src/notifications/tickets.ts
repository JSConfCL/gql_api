import { ORM_TYPE } from "~/datasources/db";
import {
  insertUserTicketsEmailLogSchema,
  userTicketsEmailLogSchema,
  UserTicketsEmailType,
} from "~/datasources/db/userTicketsEmailLogs";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";
import EmailService from "~workers/transactional_email_service";

export const sendAddedToWaitlistEmail = async ({
  DB,
  userTicketId,
  userId,
  EMAIL_SERVICE,
  logger,
}: {
  DB: ORM_TYPE;
  EMAIL_SERVICE: EmailService;
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

  await EMAIL_SERVICE.sendEventInvitationsBatch(
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
