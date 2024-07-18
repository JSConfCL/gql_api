import { createGraphQLError } from "graphql-yoga";
import { Logger } from "pino";

import { builder } from "~/builder";

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
  logger: Logger<never>,
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
  logger: Logger<never>,
  options?: Parameters<typeof createGraphQLError>[1],
) =>
  applicationError(message, ServiceErrors.UNAUTHENTICATED, logger, {
    ...options,
  });
