import { backOff } from "exponential-backoff";
import type { Resend } from "resend";

import { APP_ENV } from "~/env";
import { Logger } from "~/logging";

const numOfAttempts = 5; // Maximum number of retries
const delay = 1000; // Initial delay in milliseconds

export type ResendEmailArgs = {
  htmlContent: string;
  from: { name: string; email: string };
  to: Array<{ name?: string; email: string }>;
  subject: string;
  tags?: {
    name: string;
    value: string;
  }[];
};

const getEmails = (
  to: {
    name?: string;
    email: string;
  }[],
) => {
  if (APP_ENV === "production") {
    return to.map((t) => t.email);
  }

  return ["email-test@communityos.io"];
};

const sendEmailFunction = async (
  resend: Resend,
  logger: Logger,
  resendArgs: ResendEmailArgs | ResendEmailArgs[],
) => {
  if (Array.isArray(resendArgs)) {
    logger.info("Using batch send");
    const resendArgsArray = resendArgs.map((args) => {
      const { from, htmlContent, subject, to, tags } = args;

      return {
        to: getEmails(to),
        from: `${from.name} <${from.email}>`,
        subject,
        html: htmlContent,
        tags,
      };
    });

    const resendResponse = await resend.batch.send(resendArgsArray);

    return resendResponse;
  } else {
    logger.info("Using single send");
    const { from, htmlContent, subject, to, tags } = resendArgs;

    const resendResponse = await resend.emails.send({
      to: getEmails(to),
      from: `${from.name} <${from.email}>`,
      subject,
      html: htmlContent,
      tags,
    });

    return resendResponse;
  }
};

export async function sendTransactionalHTMLEmail(
  resend: Resend,
  logger: Logger,
  resendArgs: ResendEmailArgs | ResendEmailArgs[],
) {
  if (process?.env?.NODE_ENV === "test") {
    return;
  }

  logger.info("Sending email");

  try {
    // No tengo claro si resend tiene un ratelimit de 2 o 10 emails por segundo. (Hay documentación conflictiva).
    // Solo para estar seguros, usamos un backoff exponencial para reintentar el envío si falla, sumando 1 segundo
    await backOff(
      async () => {
        const createEmailResponse = await sendEmailFunction(
          resend,
          logger,
          resendArgs,
        );

        if (createEmailResponse.error) {
          logger.error(
            "Error sending email via Resend",
            createEmailResponse.error,
          );
          throw new Error("Error sending email via Resend");
        } else {
          logger.info("Email sent", createEmailResponse.data);
        }
      },
      {
        retry: (e, attempt) => {
          logger.error(`Error sending email, attempt ${attempt}. Error:`, e);

          return true;
        },
        numOfAttempts,
        maxDelay: delay,
        jitter: "full",
        delayFirstAttempt: false,
      },
    );
  } catch (e) {
    logger.error("Error sending email", e);
    throw new Error("Error sending email");
  }
}
