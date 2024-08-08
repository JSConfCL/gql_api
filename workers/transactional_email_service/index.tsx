import { render } from "@react-email/components";
import { WorkerEntrypoint } from "cloudflare:workers";
import * as React from "react";
import { Resend } from "resend";

import { sendTransactionalHTMLEmail } from "~/datasources/email/sendTransactionalHTMLEmail";
import { createLogger } from "~/logging";
import { ENV } from "~workers/transactional_email_service/types";

import { PurchaseOrderSuccessful } from "../../emails/templates/tickets/purchase-order-successful";

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
}
