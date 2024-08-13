import { render } from "@react-email/components";
import { WorkerEntrypoint } from "cloudflare:workers";
import * as React from "react";
import { Resend } from "resend";

import { sendTransactionalHTMLEmail } from "~/datasources/email/sendTransactionalHTMLEmail";
import { createLogger } from "~/logging";
import { ENV } from "~workers/transactional_email_service/types";

import { EventInvitation } from "../../emails/templates/tickets/event-invitation";
import { PurchaseOrderSuccessful } from "../../emails/templates/tickets/purchase-order-successful";
import { WaitlistRejected } from "../../emails/templates/tickets/waitlist-accepted";
import { WaitlistAccepted } from "../../emails/templates/tickets/waitlist-rejected";
import { YouAreOnTheWaitlist } from "../../emails/templates/tickets/you-are-on-the-waitlist-confirmation";

type ReceiverType = { name?: string; email: string };

export default class EmailService extends WorkerEntrypoint<ENV> {
  logger = createLogger("EmailService");

  resend: Resend = new Resend("");
  constructor(ctx: ExecutionContext, env: ENV) {
    super(ctx, env);

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
    eventLogoCloudflareImageURL,
    eventName,
    userName,
    email,
  }: {
    eventLogoCloudflareImageURL: string;
    eventName: string;
    userName: string;
    email: string;
  }) {
    this.logger.info(`About to send ConfirmationYouAreOnTheWaitlist`, {
      eventName,
      userName,
    });

    await sendTransactionalHTMLEmail(this.resend, this.logger, {
      htmlContent: render(
        <YouAreOnTheWaitlist
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
      subject: `Estas en la Lista de espera para ${eventName}`,
    });

    this.logger.info(`Sent ConfirmationYouAreOnTheWaitlist`);
  }

  async sendConfirmationWaitlistAccepted({
    eventLogoCloudflareImageURL,
    eventName,
    userName,
    email,
  }: {
    eventLogoCloudflareImageURL: string;
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
    eventLogoCloudflareImageURL,
    eventName,
    userName,
    email,
  }: {
    eventLogoCloudflareImageURL: string;
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

  async sendEventInvitationsBatch(
    {
      eventLogoCloudflareImageURL,
      eventName,
      userName,
    }: {
      eventLogoCloudflareImageURL: string;
      eventName: string;
      userName: string;
    },
    to: ReceiverType[],
  ) {
    this.logger.info(`About to send EventInvitation`, {
      eventName,
      userName,
    });

    await sendTransactionalHTMLEmail(this.resend, this.logger, {
      htmlContent: render(
        <EventInvitation
          eventLogoCloudflareImageURL={eventLogoCloudflareImageURL}
          eventName={eventName}
          userName={userName}
        />,
      ),
      to,
      from: {
        name: "CommunityOS",
        email: "contacto@communityos.io",
      },
      subject: `Estás invitado a ${eventName}`,
      isBatch: true,
    });
  }
}
