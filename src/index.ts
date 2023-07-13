import { createYoga } from "graphql-yoga";
import { useCSRFPrevention } from "@graphql-yoga/plugin-csrf-prevention";
import { useMaskedErrors } from "@envelop/core";
import { APP_ENV, AUTH_COOKIE_NAME } from "~/env";
import { useImmediateIntrospection } from "@envelop/immediate-introspection";
import { parse } from "cookie";
import { getDb } from "~/datasources/db";
import { Env } from "worker-configuration";
import { schema } from "~/schema";

const yoga = createYoga<Env>({
  landingPage: APP_ENV !== "production",
  graphqlEndpoint: "/graphql",
  graphiql: {
    title: "JSChileORG GraphiQL",
    // Aun debatiendo si SSE o WSS (no se si CF Workers/yoga soportará WSS bien)
    subscriptionsProtocol: "SSE",
    // Podríamos hacer un JSON stringify,
    // pero quiero evitar acciones q bloqueen el eventloop para cuando se inicie el worker.
    headers:
      '{"Authorization":"Bearer YOUR_AUTH_TOKEN_HERE", "x-graphql-csrf-token": "your-csrf-token"}',
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
  ].filter(Boolean),
  context: ({ request, DATABASE_URL, DATABASE_TOKEN }) => {
    if (!DATABASE_URL) {
      throw new Error("Missing DATABASE_URL");
    }
    if (!DATABASE_TOKEN) {
      throw new Error("Missing DATABASE_TOKEN");
    }
    const JWT = parse(request.headers.get("cookie") ?? "")[AUTH_COOKIE_NAME];
    const DB = getDb({
      authToken: DATABASE_TOKEN,
      url: DATABASE_URL,
    });
    return {
      JWT,
      DB,
    };
  },
});

export default {
  fetch: yoga.fetch,
};
