import { render } from "@react-email/components";
import { WorkerEntrypoint } from "cloudflare:workers";
import * as React from "react";
import { Resend } from "resend";

import {
  ResendEmailArgs,
  sendTransactionalHTMLEmail,
} from "~/datasources/email/sendTransactionalHTMLEmail";
import { createLogger } from "~/logging";
import { ENV } from "~workers/transactional_email_service/types";

import { EventInvitation } from "../../emails/templates/tickets/event-invitation";
import { PurchaseOrderSuccessful } from "../../emails/templates/tickets/purchase-order-successful";
import { TicketConfirmation } from "../../emails/templates/tickets/ticket-confirmation";
import { WaitlistAccepted } from "../../emails/templates/tickets/waitlist-accepted";
import { WaitlistRejected } from "../../emails/templates/tickets/waitlist-rejected";
import { YouAreOnTheWaitlist } from "../../emails/templates/tickets/you-are-on-the-waitlist-confirmation";

type ReceiverType = {
  name?: string;
  email: string;
  tags: { name: string; value: string }[];
};

// TODO: CHANGE THIS 🚨
const DEFAULT_CLOUDFLARE_LOGO_URL =
  "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/6cdd148e-b931-4b7a-f983-d75d388aff00";

export default class EmailService extends WorkerEntrypoint<ENV> {
  logger = createLogger("EmailService");

  resend: Resend;
  constructor(ctx: ExecutionContext, env: ENV) {
    super(ctx, env);

    this.logger.info("Initializing EmailService");

    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is required");
    }

    this.resend = new Resend(env.RESEND_API_KEY);
  }

  fetch() {
    return new Response("ok");
  }

  async sendPurchaseOrderSuccessful({
    purchaseOrderId,
    purchaseOrder,
    communityInfo,
    eventInfo,
  }: {
    purchaseOrderId: string;
    purchaseOrder: {
      user: {
        name?: string | null;
        username: string;
        email: string;
      };
    };
    communityInfo: {
      name: string;
      logoImageSanityRef: string | null;
    };
    eventInfo: {
      name: string;
      addressDescriptiveName: string | null;
      address: string | null;
      startDateTime: Date;
      endDateTime: Date | null;
    };
  }) {
    this.logger.info(
      `About to send purchase order email for ID: ${purchaseOrderId}`,
    );

    await sendTransactionalHTMLEmail(this.resend, this.logger, {
      htmlContent: render(
        <PurchaseOrderSuccessful
          purchaseOrderId={purchaseOrderId}
          community={{
            name: communityInfo.name,
            // communityURL: "https://cdn.com",
            logoURL: communityInfo.logoImageSanityRef,
          }}
          eventName={eventInfo.name}
          place={{
            name: eventInfo.addressDescriptiveName,
            address: eventInfo.address,
          }}
          date={{
            start: eventInfo.startDateTime,
            end: eventInfo.endDateTime,
          }}
        />,
      ),
      to: [
        {
          name: purchaseOrder.user.name ?? purchaseOrder.user.username,
          email: purchaseOrder.user.email,
        },
      ],
      from: {
        name: "CommunityOS",
        email: "contacto@communityos.io",
      },
      subject: "Tus tickets están listos 🎉",
    });

    this.logger.info(`Sent purchase order email for ID ${purchaseOrderId}`);
  }

  async sendConfirmationYouAreOnTheWaitlist({
    eventLogoCloudflareImageURL = DEFAULT_CLOUDFLARE_LOGO_URL,
    ticketName,
    userName,
    ticketId,
    email,
  }: {
    eventLogoCloudflareImageURL?: string;
    ticketName: string;
    userName?: string;
    ticketId: string;
    email: string;
  }) {
    this.logger.info(`About to send ConfirmationYouAreOnTheWaitlist`, {
      ticketName,
      userName,
    });

    await sendTransactionalHTMLEmail(this.resend, this.logger, {
      htmlContent: render(
        <YouAreOnTheWaitlist
          eventLogoCloudflareImageURL={eventLogoCloudflareImageURL}
          eventName={ticketName}
          userName={userName}
        />,
      ),
      to: [
        {
          name: userName,
          email,
        },
      ],
      from: {
        name: "CommunityOS",
        email: "contacto@communityos.io",
      },
      subject: `Estas en la Lista de espera para ${ticketName}`,
    });

    this.logger.info(`Sent ConfirmationYouAreOnTheWaitlist`);
  }

  async sendConfirmationWaitlistAccepted({
    eventLogoCloudflareImageURL = DEFAULT_CLOUDFLARE_LOGO_URL,
    eventName,
    userName,
    email,
  }: {
    eventLogoCloudflareImageURL?: string;
    eventName: string;
    userName: string;
    email: string;
  }) {
    this.logger.info(`About to send ConfirmationWaitlistAccepted`, {
      eventName,
      userName,
    });

    await sendTransactionalHTMLEmail(this.resend, this.logger, {
      htmlContent: render(
        <WaitlistAccepted
          eventLogoCloudflareImageURL={eventLogoCloudflareImageURL}
          eventName={eventName}
          userName={userName}
          userEmail={email}
        />,
      ),
      to: [
        {
          name: userName,
          email,
        },
      ],
      from: {
        name: "CommunityOS",
        email: "contacto@communityos.io",
      },
      subject: `¡Felicidades! Tienes un lugar en ${eventName}`,
    });
  }

  async sendConfirmationWaitlistRejected({
    eventLogoCloudflareImageURL = DEFAULT_CLOUDFLARE_LOGO_URL,
    eventName,
    userName,
    email,
  }: {
    eventLogoCloudflareImageURL?: string;
    eventName: string;
    userName: string;
    email: string;
  }) {
    this.logger.info(`About to send ConfirmationWaitlistRejected`, {
      eventName,
      userName,
    });

    await sendTransactionalHTMLEmail(this.resend, this.logger, {
      htmlContent: render(
        <WaitlistRejected
          eventLogoCloudflareImageURL={eventLogoCloudflareImageURL}
          eventName={eventName}
          userName={userName}
        />,
      ),
      to: [
        {
          name: userName,
          email,
        },
      ],
      from: {
        name: "CommunityOS",
        email: "contacto@communityos.io",
      },
      subject: `Gracias por tu interés en ${eventName}`,
    });
  }

  async bulkSendUserQRTicketEmail({
    // TODO: Change this image
    eventLogoCloudflareImageURL = DEFAULT_CLOUDFLARE_LOGO_URL,
    ticketName,
    to,
  }: {
    eventLogoCloudflareImageURL?: string;
    ticketName: string;
    to: (ReceiverType & { userTicketId: string })[];
  }) {
    this.logger.info(`About to send ConfirmationWaitlistAccepted`, {
      ticketName,
    });
    const resendArgs = to.map(
      (receiver) =>
        ({
          htmlContent: render(
            <TicketConfirmation
              eventLogoCloudflareImageURL={eventLogoCloudflareImageURL}
              ticketName={ticketName}
              userTicketId={receiver.userTicketId}
              userName={receiver.name}
              userEmail={receiver.email}
            />,
          ),
          tags: receiver.tags,
          subject: `Tu ticket para ${ticketName}`,
          to: [
            {
              name: receiver.name,
              email: receiver.email,
            },
          ],
          from: {
            name: "CommunityOS",
            email: "contacto@communityos.io",
          },
        }) satisfies ResendEmailArgs,
    );

    await sendTransactionalHTMLEmail(this.resend, this.logger, resendArgs);
  }

  async bulkSendEventTicketInvitations({
    // TODO: Change this image
    eventLogoCloudflareImageURL = DEFAULT_CLOUDFLARE_LOGO_URL,
    ticketName,
    ticketId,
    eventId,
    to,
  }: {
    eventLogoCloudflareImageURL?: string;
    ticketName: string;
    ticketId: string;
    eventId: string;
    to: ReceiverType[];
  }) {
    this.logger.info(`About to send batch EventInvitation`, {
      ticketName,
      eventId,
      ticketId,
    });

    const resendArgs = to.map(
      (receiver) =>
        ({
          htmlContent: render(
            <EventInvitation
              eventLogoCloudflareImageURL={eventLogoCloudflareImageURL}
              ticketName={ticketName}
              userName={receiver.name}
              userEmail={receiver.email}
            />,
          ),
          tags: receiver.tags,
          subject: `Estás invitado a ${ticketName}`,
          to: [
            {
              name: receiver.name,
              email: receiver.email,
            },
          ],
          from: {
            name: "CommunityOS",
            email: "contacto@communityos.io",
          },
        }) satisfies ResendEmailArgs,
    );

    await sendTransactionalHTMLEmail(this.resend, this.logger, resendArgs);
  }
}
