import { render } from "@react-email/components";
// eslint-disable-next-line import/no-unresolved
import { WorkerEntrypoint } from "cloudflare:workers";
import * as React from "react";

import { sendTransactionalHTMLEmail } from "./sendEmailToWorkers";
import { PurchaseOrderSuccessful } from "../../emails/templates/tickets/purchase-order-successful";

export default class EmailService extends WorkerEntrypoint {
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
    await sendTransactionalHTMLEmail({
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
      },
      subject: "Tus tickets están listos 🎉",
    });
  };

  sendTestEmail = async ({ test }: { test: string }) => {
    await Promise.resolve();
    console.log("TEST");
  };
}
