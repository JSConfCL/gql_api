import { renderAsync } from "@react-email/render";
import * as React from "react";

import { WorkEmailValidationEmail } from "emails/templates/salaries/invite-email";
import { sendTransactionalHTMLEmail } from "~/datasources/email/sendEmailToWorkers";
import { EmailMessageType } from "~/datasources/queues/mail";
import { APP_ENV } from "~/env";
import { logger } from "~/logging";

type ENV = {
  RESEND_API_KEY?: string;
  HIGHLIGHT_PROJECT_ID?: string;
};

export const queueConsumer: ExportedHandlerQueueHandler<
  ENV,
  EmailMessageType
> = async (batch, env, ctx) => {
  for await (const msg of batch.messages) {
    logger.info("Processing email for userId:", msg.body.userId);
    try {
      switch (batch.queue) {
        case "mail-queue-staging":
        case "mail-queue-production":
          await processEmailQueue(msg, env);
          break;
        default:
          throw new Error(`Unknown queue ${batch.queue}`);
      }
    } catch (e) {
      logger.error("Error processing message", e);
      msg.retry();
    }
  }
};

const processEmailQueue = async (
  message: Message<EmailMessageType>,
  env: ENV,
) => {
  const { RESEND_API_KEY } = env;
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not defined");
  }
  const htmlContent = await renderAsync(
    <WorkEmailValidationEmail
      baseUrl=""
      code={message.body.code}
      userId={message.body.userId}
    />,
  );
  // TODO: Uncomment this line to send emails.
  // await sendTransactionalHTMLEmail({
  //   htmlContent: htmlContent,
  //   to: [{ email: message.body.to }],
  //   from: { name: "Javascript Chile", email: "team@jschile.org" },
  //   subject: "Tu código de verificación",
  // });
  message.ack();
};
