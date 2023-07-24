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
  graphiql: {
    title: "JSChileORG GraphiQL",
    // Aun debatiendo si SSE o WSS (no se si CF Workers/yoga soportará WSS bien)
    subscriptionsProtocol: "SSE",
    // Podríamos hacer un JSON stringify,
    // pero quiero evitar acciones q bloqueen el eventloop para cuando se inicie el worker.
    headers:
      '{"Authorization":"Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Imluc18yTmVHa2NIWllCNmhHNGlHUUhZc2NzQkpBT1UiLCJ0eXAiOiJKV1QifQ.eyJhcHBfbWV0YWRhdGEiOnt9LCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiYXpwIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwiZW1haWwiOiJmZWxpcGUudG9ycmVzc2VwdWx2ZWRhQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJleHAiOjE2OTI3OTI4NDIsImV4dGVybmFsX2lkIjpudWxsLCJpYXQiOjE2OTAxNjQ4NDIsImlkIjoidXNlcl8yTmloVlRNdkZuNU5TcFNRakczc2czNm0zRHkiLCJpbWFnZV91cmwiOiJodHRwczovL2ltZy5jbGVyay5jb20vZXlKMGVYQmxJam9pY0hKdmVIa2lMQ0p6Y21NaU9pSm9kSFJ3Y3pvdkwybHRZV2RsY3k1amJHVnlheTVrWlhZdmIyRjFkR2hmWjJsMGFIVmlMMmx0WjE4eVRtbG9WbVp6VlRZMVRuaDVNbUl4VjFkSWQwOXJVR05LYmpVdWFuQmxaeUo5IiwiaXNzIjoiaHR0cHM6Ly9mdW5reS1ncmlmZm9uLTg0LmNsZXJrLmFjY291bnRzLmRldiIsImp0aSI6IjQyYTAxNjE5OGQyOTVmOWRhNzAzIiwibmJmIjoxNjkwMTY0ODIyLCJwdWJsaWNfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsInN1YiI6InVzZXJfMk5paFZUTXZGbjVOU3BTUWpHM3NnMzZtM0R5IiwidHdvX2ZhY3Rvcl9lbmFibGVkIjpmYWxzZSwidW5zYWZlX21ldGEiOnt9LCJ1c2VyX21ldGFkYXRhIjp7fX0.aPSJYFeO1nLW4xZQHqIU8ccev85Bn2OmF67xsfnoBQU_bNrFHKmqr3aGnkwdAXvofL-Xo21w8c0fUCYS4ZPPdWlSKsBiUV-hbSJTxVvop1yD79wmnuim_dysln-WQ3Zn6zwNaybSa_Pnrqn_VemQqaSpQxeTlELgr67g0GjnbAVuq8gdm_1KzhyhxacDJMjWwQVdoCiskLcUG9ocTh1y-EXZ7y5oMOANGnyywf2Kj9AcDAdhL-wxkC0Tz_2-7dhQ_SP07-MunJFHwl148PJJq8VHtWrUzpKD0cYaXBmraSY6xdb3FekCjRSJNJ8KvOy5t3uKBT4xHJZ9Ki_PbAc5lw", "x-graphql-csrf-token": "your-csrf-token"}',
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
