import type { IGraphQLConfig } from "graphql-config";

const config = {
  schema: "./src/generated/schema.gql",
  documents: ["./src/**/*.gql"],
} satisfies IGraphQLConfig;

export default config;
