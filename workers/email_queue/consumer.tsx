import { H } from "@highlight-run/cloudflare";
import { renderAsync } from "@react-email/render";
import * as React from "react";

import { WorkEmailValidationEmail } from "emails/templates/salaries/invite-email";
import { EmailMessageType } from "~/datasources/queues/mail";
import { APP_ENV } from "~/env";
import { sendTransactionalHTMLEmail } from "~workers/transactional_email_service/sendEmailToWorkers";

type ENV = {
  RESEND_EMAIL_KEY?: string;
  HIGHLIGHT_PROJECT_ID?: string;
};

export const queueConsumer: ExportedHandlerQueueHandler<
  ENV,
  EmailMessageType
> = async (batch, env, ctx) => {
  const r = new Request("cloudflare:workers:email_queue_consumer");
  H.init(r, { HIGHLIGHT_PROJECT_ID: env.HIGHLIGHT_PROJECT_ID ?? "" }, ctx);
  H.setAttributes({
    APP_ENV: APP_ENV ?? "none",
  });
  for await (const msg of batch.messages) {
    console.log("Processing email for userId:", msg.body.userId);
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
      console.error("Error processing message", e);
      H.consumeError(e as Error);
      msg.retry();
    }
  }
};

const processEmailQueue = async (
  message: Message<EmailMessageType>,
  env: ENV,
) => {
  const { RESEND_EMAIL_KEY } = env;
  if (!RESEND_EMAIL_KEY) {
    throw new Error("RESEND_EMAIL_KEY is not defined");
  }
  // TODO: Send azure email
  const htmlContent = await renderAsync(
    <WorkEmailValidationEmail
      baseUrl=""
      code={message.body.code}
      userId={message.body.userId}
    />,
  );
  await sendTransactionalHTMLEmail({
    htmlContent: htmlContent,
    to: [{ email: message.body.to }],
    from: { name: "Javascript Chile", email: "team@jschile.org" },
    subject: "Tu código de verificación",
  });
  message.ack();
};
