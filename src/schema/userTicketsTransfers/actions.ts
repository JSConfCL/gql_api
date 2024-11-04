import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";
import { Context } from "~/types";

type SendStartTransferTicketSuccesfulEmailsArgs = {
  transactionalEmailService: Context["RPC_SERVICE_EMAIL"];
  logger: Logger;
  userTicketTransfer: {
    id: string;
    recipientUser: {
      name: string | null;
      email: string;
      username: string | null;
    };
    senderUser: {
      name: string | null;
      email: string;
      username: string | null;
    };
    transferMessage?: string | null;
    userTicket: {
      publicId: string;
      ticketTemplate: {
        tags: string[];
        event: {
          name: string;
          addressDescriptiveName: string | null;
          address: string | null;
          startDateTime: Date;
          endDateTime: Date | null;
          logoImageReference: {
            url: string;
          } | null;
          eventsToCommunities: Array<{
            community: {
              slug: string | null;
              name: string;
              logoImageSanityRef: string | null;
            };
          }>;
        };
      };
    };
  };
};

export const sendStartTransferTicketSuccesfulEmails = async ({
  transactionalEmailService,
  logger,
  userTicketTransfer,
}: SendStartTransferTicketSuccesfulEmailsArgs) => {
  const eventInfo = userTicketTransfer.userTicket.ticketTemplate?.event;

  if (!eventInfo) {
    throw applicationError(
      "Event not found",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  const communityInfo = eventInfo.eventsToCommunities[0].community;

  if (!communityInfo) {
    throw applicationError(
      "Community relationship not found",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  await transactionalEmailService.sendTransferTicketConfirmations({
    userTicketTransfer: {
      id: userTicketTransfer.id,
      recipientUser: userTicketTransfer.recipientUser,
      senderUser: userTicketTransfer.senderUser,
      userTicket: userTicketTransfer.userTicket,
      transferMessage: userTicketTransfer?.transferMessage ?? "",
    },
    communityInfo: {
      slug: communityInfo.slug,
      name: communityInfo.name,
      logoImageSanityRef: communityInfo.logoImageSanityRef,
    },
    eventInfo: {
      name: eventInfo.name,
      addressDescriptiveName: eventInfo.addressDescriptiveName,
      address: eventInfo.address,
      startDateTime: eventInfo.startDateTime,
      endDateTime: eventInfo.endDateTime,
      eventLogoCloudflareImageURL: eventInfo.logoImageReference?.url,
    },
  });

  logger.info(`Email sent to ${userTicketTransfer.senderUser.email}`);

  logger.info(`Email sent to ${userTicketTransfer.recipientUser.email}`);
};

type SendAcceptTransferTicketSuccesfulEmailArgs = {
  transactionalEmailService: Context["RPC_SERVICE_EMAIL"];
  logger: Logger;
  userTicketTransfer: {
    id: string;
    recipientUser: {
      name: string | null;
      email: string;
      username: string | null;
    };
    senderUser: {
      name: string | null;
      email: string;
      username: string | null;
    };
    transferMessage?: string | null;
    userTicket: {
      publicId: string;
      ticketTemplate: {
        tags: string[];
        event: {
          name: string;
          addressDescriptiveName: string | null;
          address: string | null;
          startDateTime: Date;
          endDateTime: Date | null;
          logoImageReference: {
            url: string;
          } | null;
          eventsToCommunities: Array<{
            community: {
              slug: string | null;
              name: string;
              logoImageSanityRef: string | null;
            };
          }>;
        };
      };
    };
  };
};

export const sendAcceptTransferTicketSuccesfulEmail = async ({
  transactionalEmailService,
  logger,
  userTicketTransfer,
}: SendAcceptTransferTicketSuccesfulEmailArgs) => {
  const eventInfo = userTicketTransfer.userTicket.ticketTemplate?.event;

  if (!eventInfo) {
    throw applicationError(
      "Event not found",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  const communityInfo = eventInfo.eventsToCommunities[0].community;

  if (!communityInfo) {
    throw applicationError(
      "Community relationship not found",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  await transactionalEmailService.sendTransferAcceptanceNotificationToSender({
    userTicketTransfer: {
      id: userTicketTransfer.id,
      recipientUser: userTicketTransfer.recipientUser,
      senderUser: userTicketTransfer.senderUser,
      userTicket: userTicketTransfer.userTicket,
      transferMessage: "",
    },
    communityInfo: {
      slug: communityInfo.slug,
      name: communityInfo.name,
      logoImageSanityRef: communityInfo.logoImageSanityRef,
    },
    eventInfo: {
      name: eventInfo.name,
      addressDescriptiveName: eventInfo.addressDescriptiveName,
      address: eventInfo.address,
      startDateTime: eventInfo.startDateTime,
      endDateTime: eventInfo.endDateTime,
      eventLogoCloudflareImageURL: eventInfo.logoImageReference?.url,
    },
  });

  logger.info(`Email sent to ${userTicketTransfer.senderUser.email}`);
};
