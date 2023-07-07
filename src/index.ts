import { createYoga, createSchema } from "graphql-yoga";
import { useCSRFPrevention } from "@graphql-yoga/plugin-csrf-prevention";
import { useMaskedErrors } from "@envelop/core";
import { APP_ENV, AUTH_COOKIE_NAME } from "~/env";
import { useImmediateIntrospection } from "@envelop/immediate-introspection";
import { parse } from "cookie";

const yoga = createYoga({
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
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => "Hello World!",
      },
    },
  }),
  logging: "debug",
  plugins: [
    APP_ENV === "production" &&
      useCSRFPrevention({
        requestHeaders: ["x-graphql-csrf-token"],
      }),
    APP_ENV === "production" && useMaskedErrors(),
    useImmediateIntrospection(),
  ].filter(Boolean),
  context: ({ request }) => {
    const JWT = parse(request.headers.get("cookie") ?? "")[AUTH_COOKIE_NAME];
    return {
      JWT,
    };
  },
});

export default {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  fetch: yoga.fetch,
};
