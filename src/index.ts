import { createYoga, maskError } from "graphql-yoga";
import { isGraphQLError, useMaskedErrors } from "@envelop/core";
import { APP_ENV } from "~/env";
import { useImmediateIntrospection } from "@envelop/immediate-introspection";
import { ORM_TYPE, getDb } from "~/datasources/db";
import { Env } from "worker-configuration";
import { schema } from "~/schema";
import { initContextCache } from "@pothos/core";
import { useOpenTelemetry } from "@envelop/opentelemetry";
import { provider } from "~/obs/exporter";
import { verifyToken } from "@clerk/backend";
import {
  ProfileInfoSchema,
  updateUserProfileInfo,
} from "~/datasources/queries/users";
import { authZEnvelopPlugin } from "@graphql-authz/envelop-plugin";
import * as rules from "~/authz";
import { trace } from "@opentelemetry/api";
import { instrument, ResolveConfigFn } from "@microlabs/otel-cf-workers";
import { v4 } from "uuid";

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
  logging: "debug",
  plugins: [
    APP_ENV === "production" &&
      useMaskedErrors({
        errorMessage: "Internal Server Error",
        maskError: (error, message) => {
          const span = trace.getActiveSpan();
          if (span) {
            if (isGraphQLError(error)) {
              span.recordException(error);
            }
          }
          // eslint-disable-next-line no-console
          console.error("ERROR", error);
          return maskError(error, message);
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
    DATABASE_URL,
    DATABASE_TOKEN,
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
    if (!DATABASE_URL) {
      throw new Error("Missing DATABASE_URL");
    }
    if (!DATABASE_TOKEN) {
      throw new Error("Missing DATABASE_TOKEN");
    }
    if (!MAIL_QUEUE) {
      throw new Error("Missing MAIL_QUEUE");
    }
    if (!GOOGLE_PHOTOS_IMPORT_QUEUE) {
      throw new Error("Missing GOOGLE_PHOTOS_IMPORT_QUEUE");
    }
    const DB = getDb({
      authToken: DATABASE_TOKEN,
      url: DATABASE_URL,
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

const handler = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttributes({ id: v4() });
    }
    const response = await yoga.fetch(
      // @ts-expect-error los tipos de yoga.fetch estan malos
      request,
      env,
      ctx,
    );
    return response;
  },
};

const config: ResolveConfigFn = (env: Env, _trigger) => {
  return {
    exporter: {
      url: "https://api.honeycomb.io/v1/traces",
      headers: { "x-honeycomb-team": env.HONEYCOMB_API_KEY ?? "" },
    },
    service: { name: env.OTEL_SERVICE_NAME },
  };
};

export default instrument<Env, any, any>(handler, config);
