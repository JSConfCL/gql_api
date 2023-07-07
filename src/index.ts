import { createYoga, createSchema } from "graphql-yoga";

const yoga = createYoga({
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
