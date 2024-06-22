import { createGraphQLError } from "graphql-yoga";

export const unauthorizedError = (
  message: string,
  options?: Parameters<typeof createGraphQLError>[1],
) => {
  console.error("Unauthorized Error:", message);
  return createGraphQLError(message, {
    extensions: {
      code: "UNAUTHENTICATED",
    },
    ...options,
  });
};
