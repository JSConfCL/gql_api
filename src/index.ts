import { useMaskedErrors } from "@envelop/core";
import { useImmediateIntrospection } from "@envelop/immediate-introspection";
import { authZEnvelopPlugin } from "@graphql-authz/envelop-plugin";
import { createYoga, maskError } from "graphql-yoga";

import { Env } from "worker-configuration";
import { logPossibleUserIdFromJWT } from "~/authn";
import * as rules from "~/authz";
import { creageGraphqlContext } from "~/context";
import { APP_ENV } from "~/env";
import { logger } from "~/logging";
import { schema } from "~/schema";

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
      allowedHeaders: [
        "Accept",
        "Content-Type",
        "Authorization",
        "Cookie",
        "cookie",
        "x-graphql-csrf-token",
        "x-graphql-query-id",
        "x-graphql-operation-name",
      ],
      methods: ["POST", "GET", "OPTIONS"],
    };
  },
  schema,
  logging: APP_ENV === "production" ? "info" : "debug",
  plugins: [
    useMaskedErrors({
      errorMessage: "Internal Server Error",
      maskError: (error, message) => {
        logger.error("🚨 APPLICATION ERROR", error, message);
        return maskError(error, message, APP_ENV !== "production");
      },
    }),
    useImmediateIntrospection(),
    authZEnvelopPlugin({ rules }),
  ].filter(Boolean),
  context: creageGraphqlContext,
});

export default {
  fetch: async (req: Request, env: Env, ctx: ExecutionContext) => {
    logPossibleUserIdFromJWT(req);
    logger.info("🏁 — Initialize Request");
    const response = await yoga.fetch(
      // @ts-expect-error Los tipos de yoga están mal
      req,
      env,
      ctx,
    );
    logger.info("🏁 — End Request");
    return response;
  },
};
