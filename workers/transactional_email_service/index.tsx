import { render } from "@react-email/components";
import { WorkerEntrypoint } from "cloudflare:workers";
import { add } from "date-fns";
import * as React from "react";
import { Resend } from "resend";

import { JSConfCLTicketConfirmation } from "emails/templates/tickets/purchase-order-successful/jsconfcl";
import { TicketTransferAcceptedByReceiver9punto5 } from "emails/templates/tickets/ticket-transfer-accepted-by-receiver/9punto5";
import { JSConfCLAcceptedTicketTransfer } from "emails/templates/tickets/ticket-transfer-accepted-by-receiver/jsconfcl";
import { TicketTransferReceived9punto5 } from "emails/templates/tickets/ticket-transfer-received/9punto5";
import { JSConfCLTicketReceivedTransfer } from "emails/templates/tickets/ticket-transfer-received/jsconfcl";
import { TicketTransferSent9punto5 } from "emails/templates/tickets/ticket-transfer-sent/9punto5";
import { JSConfCLTicketStartTransfer } from "emails/templates/tickets/ticket-transfer-sent/jsconfcl";
import {
  ResendEmailArgs,
  sendTransactionalHTMLEmail,
} from "~/datasources/email/sendTransactionalHTMLEmail";
import { createLogger } from "~/logging";
import { ENV, CommunityInfo, EventInfo, UserTicketTransferInfo } from "~workers/transactional_email_service/types";

import { defaultInfo } from "./helpers";
import { EventInvitation } from "../../emails/templates/tickets/event-invitation";
import { PurchaseOrderSuccessful9punto5 } from "../../emails/templates/tickets/purchase-order-successful/9punto5";
import { PurchaseOrderSuccessful } from "../../emails/templates/tickets/purchase-order-successful/communityos";
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

const get9unto5TicketType = (ticketTags: string[]) => {
  return ticketTags.includes("conferencia_95") ? "CONFERENCE" : "EXPERIENCE";
};

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
    purchaseOrder,
    communityInfo,
    eventInfo,
  }: {
    purchaseOrder: {
      id: string;
      user: {
        id: string;
        name: string | null;
        username: string;
        email: string;
      };
      currencyCode: string | undefined;
      totalPrice: string | null;
      userTickets: Array<{
        publicId: string;
        ticketTemplate: {
          tags: string[];
          event: {
            name: string;
            addressDescriptiveName: string | null;
            address: string | null;
            startDateTime: Date;
            endDateTime: Date | null;
            eventsToCommunities: Array<{
              community: {
                name: string;
                logoImageSanityRef: string | null;
              };
            }>;
          };
        };
      }>;
    };
    communityInfo: CommunityInfo;
    eventInfo: EventInfo;
  }) {
    this.logger.info(
      `About to send purchase order email for ID: ${purchaseOrder.id}`,
    );

    if (communityInfo.name === "9punto5") {
      const firstUserTicket = purchaseOrder.userTickets[0];
      const firstTicketTemplate = firstUserTicket?.ticketTemplate;

      if (
        purchaseOrder.currencyCode !== "CLP" &&
        purchaseOrder.currencyCode !== "USD"
      ) {
        throw new Error(`Currency code is not supported`);
      }

      if (!firstUserTicket) {
        throw new Error(`No user ticket found for purchase order`);
      }

      if (!firstTicketTemplate) {
        throw new Error(`No ticket template found for user ticket`);
      }

      const ticketType = get9unto5TicketType(firstTicketTemplate.tags);

      await sendTransactionalHTMLEmail(this.resend, this.logger, {
        htmlContent: render(
          <PurchaseOrderSuccessful9punto5
            currencyCode={purchaseOrder.currencyCode}
            total={Number(purchaseOrder.totalPrice)}
            type={ticketType}
          />,
        ),
        to: [
          {
            name: purchaseOrder.user.name ?? purchaseOrder.user.username,
            email: purchaseOrder.user.email,
          },
        ],
        from: defaultInfo.nuevopuntocinco.from,
        replyTo: defaultInfo.nuevopuntocinco.replyTo,
        subject: "Tus tickets están listos 🎉 | 9punto5",
      });
    } else if (communityInfo.slug?.toLowerCase() === "jscl") {
      await sendTransactionalHTMLEmail(this.resend, this.logger, {
        htmlContent: render(
          <JSConfCLTicketConfirmation
            eventName={eventInfo.name}
            userID={purchaseOrder.user.id}
            userName={purchaseOrder.user.name ?? purchaseOrder.user.username}
            userEmail={purchaseOrder.user.email}
            eventLogoCloudflareImageURL={eventInfo.eventLogoCloudflareImageURL}
          />,
        ),
        to: [
          {
            name: purchaseOrder.user.name ?? purchaseOrder.user.username,
            email: purchaseOrder.user.email,
          },
        ],
        from: defaultInfo.jscl.from,
        subject: "Tu ticket para JSConf Chile 2024",
      });
    } else {
      await sendTransactionalHTMLEmail(this.resend, this.logger, {
        htmlContent: render(
          <PurchaseOrderSuccessful
            purchaseOrderId={purchaseOrder.id}
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
        from: defaultInfo.community.from,
        subject: "Tus tickets están listos 🎉",
      });
    }

    this.logger.info(`Sent purchase order email for ID ${purchaseOrder.id}`);
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
      from: defaultInfo.community.from,
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
      from: defaultInfo.community.from,
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
      from: defaultInfo.community.from,
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
          from: defaultInfo.community.from,
        }) satisfies ResendEmailArgs,
    );

    await sendTransactionalHTMLEmail(this.resend, this.logger, resendArgs);
  }

  async bulkSendEventTicketInvitations({
    // TODO: Change this image
    eventLogoCloudflareImageURL = DEFAULT_CLOUDFLARE_LOGO_URL,
    to,
  }: {
    eventLogoCloudflareImageURL?: string;
    to: (ReceiverType & {
      userTicketId: string;
      ticketName: string;
      ticketId: string;
      eventId: string;
    })[];
  }) {
    this.logger.info(
      `About to send bulkSendEventTicketInvitations to ${to.length} users`,
    );

    const resendArgs = to.map(
      (receiver) =>
        ({
          htmlContent: render(
            <EventInvitation
              eventLogoCloudflareImageURL={eventLogoCloudflareImageURL}
              ticketName={receiver.ticketName}
              userName={receiver.name}
              userEmail={receiver.email}
            />,
          ),
          tags: receiver.tags,
          subject: `Tienes una invitación a ${receiver.ticketName}`,
          to: [
            {
              name: receiver.name,
              email: receiver.email,
            },
          ],
          from: defaultInfo.community.from,
        }) satisfies ResendEmailArgs,
    );

    await sendTransactionalHTMLEmail(this.resend, this.logger, resendArgs);
  }

  async sendTransferTicketConfirmations({
    userTicketTransfer,
    communityInfo,
    eventInfo,
  }: {
    userTicketTransfer: UserTicketTransferInfo;
    communityInfo: CommunityInfo;
    eventInfo: EventInfo;
  }) {
    this.logger.info(`Sending transfer ticket notifications`, {
      userTicketTransferId: userTicketTransfer.id,
      recipientEmail: userTicketTransfer.recipientUser.email,
      senderEmail: userTicketTransfer.senderUser.email
    });
    const expirationDate = add(new Date(), { weeks: 1 });

    if (communityInfo.name === "9punto5") {
      const userTicket = userTicketTransfer.userTicket;
      const ticketTemplate = userTicket.ticketTemplate;

      const ticketType = get9unto5TicketType(ticketTemplate.tags);

      // Send confirmation email to transfer sender
      await sendTransactionalHTMLEmail(this.resend, this.logger, {
        htmlContent: render(
          <TicketTransferReceived9punto5
            transferId={userTicketTransfer.id}
            recipientName={userTicketTransfer.recipientUser.name ?? ""}
            senderName={userTicketTransfer.senderUser.name ?? ""}
            ticketType={ticketType}
            transferMessage={userTicketTransfer.transferMessage ?? ""}
            expirationDate={expirationDate}
          />,
        ),
        to: [{ name: userTicketTransfer.senderUser.name ?? "", email: userTicketTransfer.senderUser.email ?? "" }],
        from: defaultInfo.nuevopuntocinco.from,
        subject: `La entrada ${
          ticketType === "CONFERENCE" ? "CONFERENCIA" : "EXPERIENCIA"
        } 9.5 para ${userTicketTransfer.recipientUser.name ?? ""} ha sido enviada`,
      });
      
      // Send confirmation email to transfer sender
      await sendTransactionalHTMLEmail(this.resend, this.logger, {
        htmlContent: render(
          <TicketTransferSent9punto5
            ticketType={ticketType}
            recipientName={userTicketTransfer.recipientUser.name ?? ""}
            senderName={userTicketTransfer.senderUser.name ?? ""}
            transferMessage={userTicketTransfer.transferMessage ?? ""}
            recipientEmail={userTicketTransfer.recipientUser.email}
            expirationDate={expirationDate}
          />,
        ),
        to: [{ name: userTicketTransfer.senderUser.name ?? "", email: userTicketTransfer.senderUser.email ?? "" }],
        from: defaultInfo.nuevopuntocinco.from,
        subject: `La entrada ${
          ticketType === "CONFERENCE" ? "CONFERENCIA" : "EXPERIENCIA"
        } 9.5 para ${userTicketTransfer.recipientUser.name ?? ""} ha sido enviada`,
      });

      this.logger.info(`Transfer ticket notifications sent successfully`, {
        transferId: userTicketTransfer.id
      });
    } else if (communityInfo.slug?.toLowerCase() === "jscl") {
      // Send email to transfer recipient
      await sendTransactionalHTMLEmail(this.resend, this.logger, {
        htmlContent: render(
          <JSConfCLTicketReceivedTransfer
            eventName={eventInfo.name}
            eventLogoCloudflareImageURL={eventInfo.eventLogoCloudflareImageURL}
            recipientName={userTicketTransfer.recipientUser.name ?? ""}
            senderName={userTicketTransfer.senderUser.name ?? ""}
            transferMessage={userTicketTransfer.transferMessage ?? ""}
            transferId={userTicketTransfer.id}
            expirationDate={expirationDate}
          />,
        ),
        to: [{ name: userTicketTransfer.recipientUser.name ?? userTicketTransfer.recipientUser.username ?? "", email: userTicketTransfer.recipientUser.email }],
        from: defaultInfo.jscl.from,
        subject: `Te han enviado una entrada para ${eventInfo.name}`,
      });

      // Send confirmation email to transfer sender
      await sendTransactionalHTMLEmail(this.resend, this.logger, {
        htmlContent: render(
          <JSConfCLTicketStartTransfer
            eventName={eventInfo.name}
            eventLogoCloudflareImageURL={eventInfo.eventLogoCloudflareImageURL}
            recipientName={userTicketTransfer.recipientUser.name ?? ""}
            senderName={userTicketTransfer.senderUser.name ?? ""}
            transferMessage={userTicketTransfer.transferMessage ?? ""}
            recipientEmail={userTicketTransfer.recipientUser.email}
            expirationDate={expirationDate}
          />,
        ),
        to: [{ name: userTicketTransfer.senderUser.name ?? "", email: userTicketTransfer.senderUser.email ?? "" }],
        from: defaultInfo.jscl.from,
        subject: `La entrada a ${eventInfo.name} para ${userTicketTransfer.recipientUser.name ?? ""} ha sido enviada`,
      });

      this.logger.info(`Transfer ticket notifications sent successfully`, {
        transferId: userTicketTransfer.id,
      });
    } else {
      throw new Error(`No community/event handler found`);
    }
  }

  async sendTransferAcceptanceNotificationToSender({
    userTicketTransfer,
    communityInfo,
    eventInfo,
  }: {
    userTicketTransfer: UserTicketTransferInfo;
    communityInfo: CommunityInfo;
    eventInfo: EventInfo;
  }) {
    this.logger.info(`About to send TicketTransferAcceptedByReceiver`, {
      userTicketTransferId: userTicketTransfer.id,
      recipientName: userTicketTransfer.recipientUser.name,
      recipientEmail: userTicketTransfer.recipientUser.email,
      event: eventInfo.name,
    });

    if (communityInfo.name === "9punto5") {
      const userTicket = userTicketTransfer.userTicket;
      const ticketTemplate = userTicket.ticketTemplate;

      const ticketType = get9unto5TicketType(ticketTemplate.tags);

      await sendTransactionalHTMLEmail(this.resend, this.logger, {
        htmlContent: render(
          <TicketTransferAcceptedByReceiver9punto5
            ticketType={ticketType}
            recipientName={userTicketTransfer.recipientUser.name ?? ""}
            recipientEmail={userTicketTransfer.recipientUser.email}
            senderName={userTicketTransfer.senderUser.name ?? ""}
          />,
        ),
        to: [
          {
            name: userTicketTransfer.senderUser.name ?? userTicketTransfer.senderUser.username ?? "",
            email: userTicketTransfer.senderUser.email,
          },
        ],
        from: defaultInfo.nuevopuntocinco.from,
        subject: `${userTicketTransfer.recipientUser.name ?? ""} aceptó tu entrada ${
          ticketType === "CONFERENCE" ? "CONFERENCIA" : "EXPERIENCIA"
        } 9.5`,
      });
    } else if (communityInfo.slug?.toLowerCase() === "jscl") {
      await sendTransactionalHTMLEmail(this.resend, this.logger, {
        htmlContent: render(
          <JSConfCLAcceptedTicketTransfer
            eventName={eventInfo.name}
            eventLogoCloudflareImageURL={eventInfo.eventLogoCloudflareImageURL}
            recipientName={userTicketTransfer.recipientUser.name ?? ""}
            recipientEmail={userTicketTransfer.recipientUser.email}
            senderName={userTicketTransfer.senderUser.name ?? ""}
          />,
        ),
        to: [
          {
            name: userTicketTransfer.senderUser.name ?? userTicketTransfer.senderUser.username ?? "",
            email: userTicketTransfer.senderUser.email,
          },
        ],
        from: defaultInfo.jscl.from,
        subject: `${userTicketTransfer.recipientUser.name ?? ""} aceptó tu entrada para ${eventInfo.name}`
      });
    } else {
      throw new Error(`No community/event handler found`);
    }
  }
}
