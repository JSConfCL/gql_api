import { render } from "@react-email/components";
import { WorkerEntrypoint } from "cloudflare:workers";
import * as React from "react";
import { Resend } from "resend";

import { sendTransactionalHTMLEmail } from "~/datasources/email/sendTransactionalHTMLEmail";
import { createLogger } from "~/logging";

import { PurchaseOrderSuccessful } from "../../emails/templates/tickets/purchase-order-successful";

export default class EmailService extends WorkerEntrypoint {
  logger = createLogger("EmailService");
  resend = new Resend("re_C1XUkgcD_4z8UmmoqbsPgiZuStKyvH7ye");

  fetch() {
    console.log("Hi from Email RPC service");

    return new Response();
  }

  ping = () => {
    return "PONG from Email RPC service";
  };

  sendPurchaseOrderSuccessful = async ({
    purchaseOrderId,
    purchaseOrder,
    communityInfo,
    eventInfo,
  }: {
    purchaseOrderId: string;
    purchaseOrder: {
      user: {
        name?: string;
        username: string;
        email: string;
      };
    };
    communityInfo: {
      name: string;
      logoImageSanityRef: string;
    };
    eventInfo: {
      name: string;
      addressDescriptiveName: string;
      address: string;
      startDateTime: Date;
      endDateTime: Date;
    };
  }) => {
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
  };

  sendTestEmail = async ({ test }: { test: string }) => {
    await Promise.resolve();
    console.log("TEST");
  };
}
