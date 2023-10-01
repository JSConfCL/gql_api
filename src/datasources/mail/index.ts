import { Env } from "../../../worker-configuration";

export type EmailMessageType = {
  code: string;
  userId: string;
  to: string;
};
export const enqueueEmail = (
  MAIL_QUEUE: Queue,
  emailMessage: EmailMessageType,
) => {
  // Solo hacemos esto porque en el test no tenemos una cola de cloudflare queues.
  // Así que en ves de enviar el email, asumimos que se encola correctamente.
  if (!MAIL_QUEUE) {
    return;
  }
  return MAIL_QUEUE.send(emailMessage, {
    contentType: "json",
  });
};

export const sendTransactionalEmail = async (
  env: Env,
  config: {
    from: string;
    to: string | [string, ...string[]];
    subject: string;
    html: string;
  },
) => {
  if (!env.RESEND_EMAIL_KEY) {
    throw new Error("RESEND_EMAIL_KEY is not defined");
  }

  try {
    const to = Array.isArray(config.to) ? config.to : [config.to];
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_EMAIL_KEY}`,
      },
      body: JSON.stringify({
        from: config.from,
        to,
        subject: config.subject,
        html: config.html,
      }),
    });
    if (response.status >= 400) {
      throw new Error(`API Error Sending email. Status ${response.status}`);
    }
  } catch (e) {
    throw new Error("Error sending email");
  }
};
