import { createYoga } from "graphql-yoga";
import { useCSRFPrevention } from "@graphql-yoga/plugin-csrf-prevention";
import { useMaskedErrors } from "@envelop/core";
import { APP_ENV } from "~/env";
import { useImmediateIntrospection } from "@envelop/immediate-introspection";
import { getDb } from "~/datasources/db";
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

const getUser = async ({
  request,
  CLERK_ISSUER_ID,
  CLERK_PEM_PUBLIC_KEY,
  DATABASE_TOKEN,
  DATABASE_URL,
}: {
  request: Request;
  CLERK_ISSUER_ID: string;
  CLERK_PEM_PUBLIC_KEY: string;
  DATABASE_TOKEN: string;
  DATABASE_URL: string;
}) => {
  const DB = getDb({
    authToken: DATABASE_TOKEN,
    url: DATABASE_URL,
  });
  const JWT_TOKEN = (request.headers.get("Authorization") ?? "").split(" ")[1];
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
      headers: `{
  "Authorization":"Bearer ${ENFORCED_JWT_TOKEN ?? "INSERT_TOKEN_HERE"}",
  "x-graphql-csrf-token": "your-csrf-token-in-production"
}`,
    };
  },
  cors: {
    origin: ["http://localhost:3000", "https://localhost:3000"],
    credentials: true,
    methods: ["POST"],
  },
  schema,
  logging: "debug",
  plugins: [
    APP_ENV === "production" &&
      useCSRFPrevention({
        requestHeaders: ["x-graphql-csrf-token"],
      }),
    APP_ENV === "production" && useMaskedErrors(),
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
  ].filter(Boolean),
  context: async ({
    request,
    DATABASE_URL,
    DATABASE_TOKEN,
    CLERK_PEM_PUBLIC_KEY,
    CLERK_ISSUER_ID,
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
    const DB = getDb({
      authToken: DATABASE_TOKEN,
      url: DATABASE_URL,
    });
    const USER = await getUser({
      request,
      CLERK_ISSUER_ID,
      CLERK_PEM_PUBLIC_KEY,
      DATABASE_TOKEN,
      DATABASE_URL,
    });
    return {
      ...initContextCache(),
      DB,
      USER,
    };
  },
});

export default {
  fetch: yoga.fetch,
};
