const defaulFromtProps = { name: "Test Sender", email: "comms@communityos.io" };
export async function sendTransactionalHTMLEmail({
  htmlContent,
  to,
  from = defaulFromtProps,
  subject,
}: {
  htmlContent: string;
  from: { name: string; email?: string };
  to: Array<{ name?: string; email: string }>;
  subject: string;
}) {
  const emailFrom = {
    ...defaulFromtProps,
    ...from,
  };
  try {
    const send_request = new Request(
      "https://api.mailchannels.net/tx/v1/send",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to,
            },
          ],
          from: emailFrom,
          subject,
          content: [
            {
              type: "text/html",
              value: htmlContent,
            },
          ],
        }),
      },
    );

    const response = await fetch(send_request);
    const responseText = await response.text();
    console.log("Email sent", responseText);
    return true;
  } catch (e) {
    console.error("Error sending email", e);
    return false;
  }
}
