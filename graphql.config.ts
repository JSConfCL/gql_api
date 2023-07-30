import type { IGraphQLConfig } from "graphql-config";

const config = {
  schema: "http://127.0.0.1:8787/graphql",
  documents: ["./src/**/*.gql"],
} satisfies IGraphQLConfig;

export default config;
