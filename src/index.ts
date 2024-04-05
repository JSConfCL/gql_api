// import { verifyToken } from "@clerk/backend";
import { useMaskedErrors } from "@envelop/core";
import { useImmediateIntrospection } from "@envelop/immediate-introspection";
import { useOpenTelemetry } from "@envelop/opentelemetry";
import { authZEnvelopPlugin } from "@graphql-authz/envelop-plugin";
import { H } from "@highlight-run/cloudflare";
import { initContextCache } from "@pothos/core";
import { decode, verify } from "@tsndr/cloudflare-worker-jwt";
import { createYoga, maskError } from "graphql-yoga";

import { Env } from "worker-configuration";
import * as rules from "~/authz";
import { ORM_TYPE, getDb } from "~/datasources/db";
import { updateUserProfileInfo } from "~/datasources/queries/users";
import { APP_ENV } from "~/env";
import { provider } from "~/obs/exporter";
import { schema } from "~/schema";

import { insertUsersSchema } from "./datasources/db/users";
import { getSanityClient } from "./datasources/sanity/client";
import { getStripeClient } from "./datasources/stripe/client";

// We get the token either from the Authorization header or from the "sb-access-token" cookie
const getAuthToken = (request: Request) => {
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    return token;
  }
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith("sb-access-token="));
    if (tokenCookie) {
      return tokenCookie.split("=")[1];
    }
  }
  return null;
};

const decodeJWT = (JWT_TOKEN: string) => {
  try {
    const { payload } = decode(JWT_TOKEN) as {
      payload: {
        aud: string;
        exp: number;
        iat: number;
        iss: string;
        sub: string;
        email: string;
        phone: string;
        app_metadata: { provider: string; providers: string[] };
        user_metadata: {
          avatar_url: string;
          email: string;
          email_verified: boolean;
          full_name: string;
          iss: string;
          name: string;
          phone_verified: boolean;
          preferred_username: string;
          provider_id: string;
          picture: string;
          sub: string;
          user_name: string;
        };
        role: string;
        aal: string;
        amr: { method: "oauth"; timestamp: number }[];
        session_id: string;
        is_anonymous: boolean;
      };
    };
    return payload;
  } catch (e) {
    console.error("Could not parse token", e);
    return null;
  }
};

const getUser = async ({
  request,
  SUPABASE_JWT_DECODER,
  DB,
}: {
  request: Request;
  SUPABASE_JWT_DECODER: string;
  DB: ORM_TYPE;
}) => {
  const JWT_TOKEN = getAuthToken(request);
  if (!JWT_TOKEN) {
    console.info("No token present");
    return null;
  }
  const payload = decodeJWT(JWT_TOKEN);
  if (!payload) {
    console.error("Could not parse token");
    return null;
  }
  const isExpired = payload.exp < Date.now() / 1000;
  console.log("isExpired", isExpired);
  // check if token is expired (exp)
  if (isExpired) {
    console.error("Token expired");
    return null;
  }
  const verified = await verify(JWT_TOKEN, SUPABASE_JWT_DECODER);
  console.log("verified", verified);
  if (!verified) {
    console.error("Could not verify token");
    return null;
  }
  const { avatar_url, name, user_name, email_verified, sub, picture } =
    payload.user_metadata;

  if (payload.exp < Date.now() / 1000) {
    console.error("Token expired");
    return null;
  }
  const profileInfo = insertUsersSchema.safeParse({
    email: payload.email,
    emailVerified: email_verified,
    imageUrl: avatar_url ? avatar_url : picture ? picture : "",
    externalId: sub,
    name,
    username: user_name,
    publicMetadata: payload,
  });
  if (profileInfo.success === false) {
    console.error("Could not parse profile info", profileInfo.error);
    throw new Error("Could not parse profile info", profileInfo.error);
  }
  console.log("Updating profile Info for user ID:", sub);
  return updateUserProfileInfo(DB, profileInfo.data);
};

const attachPossibleUserIdFromJWT = (request: Request) => {
  const JWT_TOKEN = (request.headers.get("Authorization") ?? "").split(" ")[1];
  const isOptions = request.method === "OPTIONS";
  if (isOptions) {
    return null;
  }

  if (!JWT_TOKEN) {
    console.info("No token present");
    return null;
  }
  try {
    const { payload } = decode(JWT_TOKEN);
    const userId = (payload as { id: string })?.id ?? "ANONYMOUS";
    H.setAttributes({
      userId: userId,
    });
  } catch (error) {
    console.error("Could not parse token", error);
    return null;
  }
};

export const yoga = createYoga<Env>({
  landingPage: APP_ENV !== "production",
  graphqlEndpoint: "/graphql",
  graphiql: (_, { ENFORCED_JWT_TOKEN }) => {
    return {
      title: "JSChileORG GraphiQL",
      // Aun debatiendo si SSE o WSS (no se si CF Workers/yoga soportará WSS bien)
      subscriptionsProtocol: "SSE",
      // Podríamos hacer un JSON stringify,
      // pero quiero evitar acciones q bloqueen el eventloop para cuando se inicie el worker.
      headers:
        APP_ENV === "development"
          ? `{
  "Authorization":"Bearer ${ENFORCED_JWT_TOKEN ?? "INSERT_TOKEN_HERE"}",
  "x-graphql-csrf-token": "your-csrf-token-in-production"
}`
          : `{}`,
    };
  },
  cors: (request) => {
    const requestOrigin = request.headers.get("origin") ?? undefined;
    return {
      origin: requestOrigin,
      credentials: true,
      allowedHeaders: ["*"],
      methods: ["POST", "GET", "OPTIONS"],
    };
  },
  schema,
  logging: APP_ENV === "production" ? "info" : "debug",
  plugins: [
    useMaskedErrors({
      errorMessage: "Internal Server Error",
      maskError: (error, message) => {
        H.consumeError(error as Error);
        console.error("🚨 APPLICATION ERROR", error, message);
        return maskError(error, message, APP_ENV !== "production");
      },
    }),
    useImmediateIntrospection(),
    (APP_ENV === "production" || APP_ENV === "staging") &&
      useOpenTelemetry(
        {
          resolvers: true, // Tracks resolvers calls, and tracks resolvers thrown errors
          variables: true, // Includes the operation variables values as part of the metadata collected
          result: true, // Includes execution result object as part of the metadata collected
        },
        provider,
        0,
        {},
        "graphql-jschile",
      ),
    authZEnvelopPlugin({ rules }),
  ].filter(Boolean),
  context: async ({
    request,
    NEON_URL,
    CLERK_PEM_PUBLIC_KEY,
    CLERK_ISSUER_ID,
    MAIL_QUEUE,
    GOOGLE_PHOTOS_IMPORT_QUEUE,
    SANITY_PROJECT_ID,
    SANITY_DATASET,
    SANITY_API_VERSION,
    SANITY_SECRET_TOKEN,
    SUPABASE_JWT_DECODER,
    STRIPE_KEY,
  }) => {
    if (!CLERK_PEM_PUBLIC_KEY) {
      throw new Error("Missing CLERK_KEY");
    }
    if (!CLERK_ISSUER_ID) {
      throw new Error("Missing CLERK_ISSUER_ID");
    }
    if (!MAIL_QUEUE) {
      throw new Error("Missing MAIL_QUEUE");
    }
    if (!GOOGLE_PHOTOS_IMPORT_QUEUE) {
      throw new Error("Missing GOOGLE_PHOTOS_IMPORT_QUEUE");
    }
    if (!NEON_URL) {
      throw new Error("Missing NEON_URL");
    }
    if (!NEON_URL) {
      throw new Error("Missing NEON_URL");
    }
    if (!SUPABASE_JWT_DECODER) {
      throw new Error("Missing SUPABASE_JWT_DECODER");
    }
    if (!STRIPE_KEY) {
      throw new Error("Missing STRIPE_KEY");
    }
    if (
      !SANITY_PROJECT_ID ||
      !SANITY_DATASET ||
      !SANITY_API_VERSION ||
      !SANITY_SECRET_TOKEN
    ) {
      throw new Error("Missing Sanity Configuration");
    }
    const GET_SANITY_CLIENT = () =>
      getSanityClient({
        projectId: SANITY_PROJECT_ID,
        dataset: SANITY_DATASET,
        apiVersion: SANITY_API_VERSION,
        token: SANITY_SECRET_TOKEN,
        useCdn: true,
      });

    const GET_STRIPE_CLIENT = () => getStripeClient(STRIPE_KEY);
    const DB = getDb({
      neonUrl: NEON_URL,
    });
    console.log("Getting user");
    const USER = await getUser({
      request,
      SUPABASE_JWT_DECODER,
      DB,
    });
    console.log("User Obtained:", USER?.id);
    return {
      ...initContextCache(),
      DB,
      USER,
      MAIL_QUEUE,
      GET_SANITY_CLIENT,
      GET_STRIPE_CLIENT,
    };
  },
});

export default {
  fetch: async (req: Request, env: Env, ctx: ExecutionContext) => {
    H.init(req, { HIGHLIGHT_PROJECT_ID: env.HIGHLIGHT_PROJECT_ID ?? "" }, ctx);
    H.setAttributes({
      APP_ENV: APP_ENV ?? "none",
    });

    attachPossibleUserIdFromJWT(req);
    // eslint-disable-next-line no-console
    console.log("🏁 — Initialize Request");
    const response = await yoga.fetch(
      // @ts-expect-error Los tipos de yoga están mal
      req,
      env,
      ctx,
    );
    H.sendResponse(response);
    return response;
  },
};
