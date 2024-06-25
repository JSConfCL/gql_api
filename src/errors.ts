import { createGraphQLError } from "graphql-yoga";

import { builder } from "~/builder";
import { logger } from "~/logging";

enum ServiceErrors {
  UNAUTHENTICATED = "UNAUTHENTICATED",
}

builder.enumType(ServiceErrors, {
  name: "ServiceErrors",
});

const error_codes = {
  [ServiceErrors.UNAUTHENTICATED]: 401,
} as const;

export const applicationError = (
  message: string,
  errorType: ServiceErrors,
  options?: Parameters<typeof createGraphQLError>[1],
) => {
  logger.error(`Service error: ${errorType}: ${message}`);
  return createGraphQLError(message, {
    extensions: {
      code: error_codes[errorType],
      type: errorType,
    },
    ...options,
  });
};

export const unauthorizedError = (
  message: string,
  options?: Parameters<typeof createGraphQLError>[1],
) =>
  applicationError(message, ServiceErrors.UNAUTHENTICATED, {
    ...options,
  });
