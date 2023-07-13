import { createSchema } from "graphql-yoga";
import { Env } from "worker-configuration";

export const schema = createSchema<Env>({
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
});
