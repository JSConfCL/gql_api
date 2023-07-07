import { createYoga, createSchema } from "graphql-yoga";

const yoga = createYoga({
  landingPage: false,
  graphqlEndpoint: "/graphql",
  graphiql: {
    title: "JSChileORG GraphiQL",
    // Aun debatiendo si SSE o WSS (no se si CF Workers/yoga soportará WSS bien)
    subscriptionsProtocol: "SSE",
    // Podríamos hacer un JSON stringify,
    // pero quiero evitar acciones q bloqueen el eventloop para cuando se inicie el worker.
    headers: '{"Authorization":"Bearer your-auth-key"}',
  },
  cors: {
    origin: ["http://localhost:3000", "https://localhost:3000"],
    credentials: true,
    allowedHeaders: ["X-Custom-Header"],
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
});
export default {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  fetch: yoga.fetch,
};
