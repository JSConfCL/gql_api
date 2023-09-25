import { Env } from "../../worker-configuration";
import { EmailMessageType, sendTransactionalEmail } from "../datasources/mail";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const queueConsumer = async (batch: MessageBatch<any>, env: Env) => {
  console.log(
    "Processing batch for",
    batch.queue,
    "with",
    batch.messages.length,
    "messages",
  );
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
    console.log("Sending email", message.body);
    await sendTransactionalEmail(env, {
      from: "Javascript Chile <team@jschile.org>",
      to: message.body.to,
      subject: "Tu código de verificación",
      html: `<p>Este es tu código de verificación: ${message.body.code}</p>`,
    });
    message.ack();
  } catch (e) {
    message.retry();
  }
};
