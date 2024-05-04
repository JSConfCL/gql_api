import crypto from "crypto";

import { Hono } from "hono";
import { google, SocialProvider } from "worker-auth-providers";

import { ENV } from "./types";

type HONO_ENV = {
  Bindings: ENV;
};

const app = new Hono<HONO_ENV>();

app.get("/send/:email_template", async (c) => {
  try {
    const webhookPayload = c.body;
    const tallySignature = c.req.header("tally-signature");
    const yourSigningSecret = c.env.TALLY_SIGNING_SECRET;
    const calculatedSignature = crypto
      .createHmac("sha256", yourSigningSecret)
      .update(JSON.stringify(webhookPayload))
      .digest("base64");
    console.log({ tallySignature, calculatedSignature });
    console.log("webhookPayload", webhookPayload);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.log(error);
    throw error;
  }
});

export default app;
