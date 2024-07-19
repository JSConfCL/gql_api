import { Hono } from "hono";
import { Resend } from "resend";

import { createLogger } from "~/logging";

import { mailRouter } from "./emailrouter";
import { ENV } from "./types";

type HONO_ENV = {
  Bindings: ENV;
  Variables: {
    logger: ReturnType<typeof createLogger>;
  };
};

const app = new Hono<HONO_ENV>();

app.use(async (c, next) => {
  c.set("logger", createLogger("email_webhook"));
  await next();
});

async function calculateSignature(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    {
      name: "HMAC",
    },
    key,
    new TextEncoder().encode(data),
  );

  return bufferToBase64(signature);
}

function bufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);

  return btoa(String.fromCharCode(...bytes));
}

app.post("/send/:template", async (c) => {
  const logger = c.get("logger");

  try {
    const webhookPayload = await c.req.json<unknown>();
    const tallySignature = c.req.header("tally-signature");
    const yourSigningSecret = c.env.TALLY_SIGNING_SECRET;
    const resendApiKey = c.env.RESEND_API_KEY;
    const emailTemplate = c.req.param("template");

    if (!resendApiKey) {
      throw new Error("Resend API Key is required");
    }

    const resend = new Resend(resendApiKey);
    const base64Signature = await calculateSignature(
      yourSigningSecret,
      JSON.stringify(webhookPayload),
    );

    if (base64Signature === tallySignature) {
      await mailRouter({ emailTemplate, body: webhookPayload, resend, logger });
    }

    return c.json({ message: "Hello, World!" });
  } catch (error: any) {
    logger.error(error);
    throw error;
  }
});

app.get("/", (c) => {
  const logger = c.get("logger");

  try {
    return c.json({ message: "Hello, World!" });
  } catch (error: any) {
    logger.error(error);
    throw error;
  }
});

export default app;
