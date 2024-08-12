import { backOff } from "exponential-backoff";
import type { Resend } from "resend";

import { Logger } from "~/logging";

const numOfAttempts = 5; // Maximum number of retries
const delay = 1000; // Initial delay in milliseconds

export async function sendTransactionalHTMLEmail(
  resend: Resend,
  logger: Logger,
  {
    htmlContent,
    to,
    from,
    subject,
  }: {
    htmlContent: string;
    from: { name: string; email: string };
    to: Array<{ name?: string; email: string }>;
    subject: string;
  },
) {
  if (process?.env?.NODE_ENV === "test") {
    return;
  }

  const resendPayload = {
    to: to.map((t) => t.email),
    from: `${from.name} <${from.email}>`,
    subject,
    html: htmlContent,
  };

  try {
    // No tengo claro si resend tiene un ratelimit de 2 o 10 emails por segundo. (Hay documentación conflictiva).
    // Solo para estar seguros, usamos un backoff exponencial para reintentar el envío si falla, sumando 1 segundo
    await backOff(
      async () => {
        const createEmailResponse = await resend.emails.send(resendPayload);

        if (createEmailResponse.error) {
          logger.error(
            "Error sending email via Resend",
            createEmailResponse.error,
          );
          throw new Error("Error sending email via Resend");
        } else {
          logger.info("Email sent", createEmailResponse);
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
