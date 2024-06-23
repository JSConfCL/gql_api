import { Hono } from "hono";
import { google, SocialProvider } from "worker-auth-providers";

import { logger } from "~/logging";

import { ENV } from "./types";

type HONO_ENV = {
  Bindings: ENV;
};

const app = new Hono<HONO_ENV>();

app.get("/auth/google", async (c) => {
  try {
    const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URL, GOOGLE_CLIENT_SECRET } =
      c.env;
    if (!GOOGLE_CLIENT_ID) {
      throw new Error("Missing GOOGLE_CLIENT_ID");
    }
    if (!GOOGLE_REDIRECT_URL) {
      throw new Error("Missing GOOGLE_REDIRECT_URL");
    }
    if (!GOOGLE_CLIENT_SECRET) {
      throw new Error("Missing GOOGLE_CLIENT_SECRET");
    }
    const location = await (google as SocialProvider<string>).redirect({
      options: {
        clientId: GOOGLE_CLIENT_ID,
        redirectTo: GOOGLE_REDIRECT_URL,
        scope: ["https://www.googleapis.com/auth/photoslibrary"],
      },
    });

    return new Response(null, {
      status: 302,
      headers: {
        location,
      },
    });
  } catch (error: any) {
    logger.error(error);
    throw error;
  }
});
app.all("/auth/google/success", async (c) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URL, GOOGLE_CLIENT_SECRET } = c.env;
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Missing GOOGLE_CLIENT_ID");
  }
  if (!GOOGLE_REDIRECT_URL) {
    throw new Error("Missing GOOGLE_REDIRECT_URL");
  }
  if (!GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing GOOGLE_CLIENT_SECRET");
  }
  const { code } = c.req.query();
  const { access_token: accessToken } = await (
    google as SocialProvider<string>
  ).getTokensFromCode(code, {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUrl: GOOGLE_REDIRECT_URL,
  });
  return c.text(accessToken);
});

export default app;
