import { createGraphQLError } from "graphql-yoga";

import { builder } from "~/builder";
import { Logger } from "~/logging";

export enum ServiceErrors {
  UNAUTHENTICATED = "UNAUTHENTICATED",
  FAILED_PRECONDITION = "FAILED_PRECONDITION",
  FORBIDDEN = "FORBIDDEN",
}

builder.enumType(ServiceErrors, {
  name: "ServiceErrors",
});

const error_codes = {
  [ServiceErrors.UNAUTHENTICATED]: 401,
  [ServiceErrors.FORBIDDEN]: 403,
  [ServiceErrors.FAILED_PRECONDITION]: 412,
} as const;

export const applicationError = (
  message: string,
  errorType: ServiceErrors,
  logger: Logger,
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
  logger: Logger,
  options?: Parameters<typeof createGraphQLError>[1],
) =>
  applicationError(message, ServiceErrors.UNAUTHENTICATED, logger, {
    ...options,
  });
