import type { Resend } from "resend";

export async function sendTransactionalHTMLEmail(
  resend: Resend,
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
    return true;
  }
  try {
    const createEmailResponse = await resend.emails.send({
      to: to.map((t) => t.email),
      from: `${from.name} <${from.email}>`,
      subject,
      html: htmlContent,
    });
    if (createEmailResponse.error) {
      console.error(
        "Error sending email via Resend",
        createEmailResponse.error,
      );
      return false;
    } else {
      console.log("Email sent", createEmailResponse);
      return true;
    }
  } catch (e) {
    console.error("Error sending email", e);
    return false;
  }
}
