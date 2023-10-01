/* eslint-disable @typescript-eslint/no-unused-vars */
import { PreExecutionRule, UnauthorizedError } from "@graphql-authz/core";
import { GraphQLError } from "graphql";
import { GraphqlContext } from "~/builder";

export class IsAuthenticated extends PreExecutionRule {
  error = new UnauthorizedError("User is not authenticated");
  public execute({ USER, DB }: GraphqlContext, fieldArgs: { id?: string }) {
    return !!USER;
  }
}

export class IsSameUser extends PreExecutionRule {
  error = new UnauthorizedError("Not authorized");
  public execute(
    { USER, DB }: GraphqlContext,
    fieldArgs: { input: { id: string } },
  ) {
    if (!USER || !fieldArgs.input.id) {
      return false;
    }
    return USER.id === fieldArgs.input.id;
  }
}

export class IsSuperAdmin extends PreExecutionRule {
  public execute({ USER }: GraphqlContext, fieldArgs: { id?: string }) {
    if (!USER) {
      return false;
    }
    return Boolean(USER.isSuperAdmin);
  }
}
