import { Hono } from "hono";

import { mailRouter } from "./emailrouter";
import { ENV } from "./types";

type HONO_ENV = {
  Bindings: ENV;
};

const app = new Hono<HONO_ENV>();

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

  console.log({ signature, key });
  return bufferToBase64(signature);
}

function bufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

app.post("/send/:template", async (c) => {
  try {
    const webhookPayload = await c.req.json<unknown>();
    const tallySignature = c.req.header("tally-signature");
    const yourSigningSecret = c.env.TALLY_SIGNING_SECRET;
    const base64Signature = await calculateSignature(
      yourSigningSecret,
      JSON.stringify(webhookPayload),
    );
    if (base64Signature === tallySignature) {
      await mailRouter(c.req.param("template"), webhookPayload);
    }
    return c.json({ message: "Hello, World!" });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.log(error);
    throw error;
  }
});

app.get("/", (c) => {
  try {
    return c.json({ message: "Hello, World!" });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.log(error);
    throw error;
  }
});

export default app;

// /7R5CR4Rl5vy7ym2wITZiJzT8Sbp07PBST4gUt0DxnU=
