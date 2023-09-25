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
    const text = await response.text();
    console.log("RESPONSE", text);
  } catch (e) {
    console.error(e);
    throw new Error("Error sending email");
  }
};
