import { render } from "@react-email/components";
import { WorkerEntrypoint } from "cloudflare:workers";
import * as React from "react";
import { Resend } from "resend";

import { sendTransactionalHTMLEmail } from "~/datasources/email/sendTransactionalHTMLEmail";
import { createLogger } from "~/logging";

import { PurchaseOrderSuccessful } from "../../emails/templates/tickets/purchase-order-successful";

export default class EmailService extends WorkerEntrypoint<{
  RESEND_API_KEY: string;
}> {
  logger = createLogger("EmailService");

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
    await sendTransactionalHTMLEmail(
      new Resend(this.env.RESEND_API_KEY),
      this.logger,
      {
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
      },
    );
    this.logger.info(`Sent purchase order email for ID ${purchaseOrderId}`);
  }
}
