import WorkEmailValidationEmail from "../../emails/invite-email";
import * as React from "react";
import { Env } from "../../worker-configuration";
import { EmailMessageType, sendTransactionalEmail } from "../datasources/mail";
import { render } from "@react-email/render";

export const queueConsumer = async (batch: MessageBatch<any>, env: Env) => {
  for await (const msg of batch.messages) {
    switch (batch.queue) {
      case "mail-queue-staging":
      case "mail-queue-production":
        await processEmailQueue(msg as Message<EmailMessageType>, env);
        break;
      default:
        throw new Error(`Unknown queue ${batch.queue}`);
    }
  }
};

const processEmailQueue = async (
  message: Message<EmailMessageType>,
  env: Env,
) => {
  try {
    // TODO: Send azure email
    await sendTransactionalEmail(env, {
      from: "Javascript Chile <team@jschile.org>",
      to: message.body.to,
      subject: "Tu código de verificación",
      html: render(
        <WorkEmailValidationEmail
          baseUrl=""
          code={message.body.code}
          userId={message.body.userId}
        />,
      ),
    });
    message.ack();
  } catch (e) {
    message.retry();
  }
};
