import WorkEmailValidationEmail from "../../emails/invite-email";
import * as React from "react";
import {
  EmailMessageType,
  sendTransactionalEmail,
} from "../../src/datasources/queues/mail";
import { render } from "@react-email/render";

type ENV = {
  RESEND_EMAIL_KEY?: string;
};

export const queueConsumer: ExportedHandlerQueueHandler<ENV> = async (
  batch,
  env,
) => {
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
  env: ENV,
) => {
  try {
    const { RESEND_EMAIL_KEY } = env;
    if (!RESEND_EMAIL_KEY) {
      throw new Error("RESEND_EMAIL_KEY is not defined");
    }
    // TODO: Send azure email
    await sendTransactionalEmail(
      {
        RESEND_EMAIL_KEY,
      },
      {
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
      },
    );
    message.ack();
  } catch (e) {
    message.retry();
  }
};
