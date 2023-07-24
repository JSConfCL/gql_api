import { preExecRule } from "@graphql-authz/core";

const IsAuthenticated = preExecRule()((context) => !!context.user);

export const rules = {
  IsAuthenticated,
} as const;
