import { H } from "@highlight-run/cloudflare";
import { createYoga, maskError } from "graphql-yoga";
import { useMaskedErrors } from "@envelop/core";
import { APP_ENV } from "~/env";
import { useImmediateIntrospection } from "@envelop/immediate-introspection";
import { ORM_TYPE, getDb } from "~/datasources/db";
import { Env } from "worker-configuration";
import { schema } from "~/schema";
import { initContextCache } from "@pothos/core";
import { useOpenTelemetry } from "@envelop/opentelemetry";
import { provider } from "~/obs/exporter";
import { verifyToken } from "@clerk/backend";
import jwt from "@tsndr/cloudflare-worker-jwt";
import {
  ProfileInfoSchema,
  updateUserProfileInfo,
} from "~/datasources/queries/users";
import { authZEnvelopPlugin } from "@graphql-authz/envelop-plugin";
import * as rules from "~/authz";

const getUser = async ({
  request,
  CLERK_ISSUER_ID,
  CLERK_PEM_PUBLIC_KEY,
  DB,
}: {
  request: Request;
  CLERK_ISSUER_ID: string;
  CLERK_PEM_PUBLIC_KEY: string;
  DB: ORM_TYPE;
}) => {
  const JWT_TOKEN = (request.headers.get("Authorization") ?? "").split(" ")[1];
  if (!JWT_TOKEN) {
    return null;
  }
  const verified = await verifyToken(JWT_TOKEN, {
    issuer: CLERK_ISSUER_ID,
    jwtKey: CLERK_PEM_PUBLIC_KEY,
  });
  if (!verified) {
    return null;
  }
  const {
    email,
    email_verified,
    two_factor_enabled,
    image_url,
    external_id,
    name,
    surname,
    unsafe_metadata,
    public_metadata,
    sub,
    exp,
  } = verified;

  if (exp < Date.now() / 1000) {
    return null;
  }
  const profileInfo = ProfileInfoSchema.parse({
    email,
    email_verified,
    two_factor_enabled,
    image_url,
    external_id,
    name,
    surname,
    unsafe_metadata,
    public_metadata,
    sub,
  });
  return updateUserProfileInfo(DB, profileInfo);
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
    const { payload } = jwt.decode(JWT_TOKEN);
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
        console.error("🚨ERROR🚨", error, message);
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
    const DB = getDb({
      neonUrl: NEON_URL,
    });
    const USER = await getUser({
      request,
      CLERK_ISSUER_ID,
      CLERK_PEM_PUBLIC_KEY,
      DB,
    });
    return {
      ...initContextCache(),
      DB,
      USER,
      MAIL_QUEUE,
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
