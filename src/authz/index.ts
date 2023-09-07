/* eslint-disable @typescript-eslint/no-unused-vars */
import { PreExecutionRule, UnauthorizedError } from "@graphql-authz/core";
import { GraphqlContext } from "~/builder";

export class IsAuthenticated extends PreExecutionRule {
  error = new UnauthorizedError("User is not authenticated");
  public execute({ USER, DB }: GraphqlContext, fieldArgs: { id?: string }) {
    return !!USER;
  }
}

export class CanEditCommunity extends PreExecutionRule {
  error = new UnauthorizedError("User cannot edit community");

  public async execute(
    { USER, DB }: GraphqlContext,
    fieldArgs: { id?: string },
  ) {
    if (!fieldArgs.id) {
      return false;
    }
    if (!USER) {
      return false;
    }
    const user = await DB.query.communitySchema.findFirst({
      with: {
        usersToCommunities: {
          where: (utc, { eq, and }) =>
            and(eq(utc.userId, USER.id), eq(utc.role, "admin")),
        },
      },
    });
    return Boolean(user);
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

export class CanCreateEvent extends PreExecutionRule {
  public async execute(
    { USER, DB }: GraphqlContext,
    fieldArgs: { input: { communityId: string } },
  ) {
    if (!USER || !fieldArgs?.input?.communityId) {
      return false;
    }
    const user = await DB.query.usersToCommunitiesSchema.findFirst({
      where: (utc, { eq, and }) =>
        and(eq(utc.userId, USER.id), eq(utc.role, "admin")),
    });

    return Boolean(user);
  }
}

export class isCommunityCollaborator extends PreExecutionRule {
  public async execute(
    { USER, DB }: GraphqlContext,
    fieldArgs: { input: { communityId: string } },
  ) {
    if (!USER || !fieldArgs?.input?.communityId) {
      return false;
    }
    const user = await DB.query.communitySchema.findFirst({
      with: {
        usersToCommunities: {
          where: (utc, { eq, and }) =>
            and(eq(utc.userId, USER.id), eq(utc.role, "admin")),
        },
      },
    });
    return Boolean(user);
  }
}

export class isCommunityAdmin extends PreExecutionRule {
  public async execute(
    { USER, DB }: GraphqlContext,
    fieldArgs: { input: { communityId: string } },
  ) {
    if (!USER || !fieldArgs?.input?.communityId) {
      return false;
    }
    const user = await DB.query.communitySchema.findFirst({
      with: {
        usersToCommunities: {
          where: (utc, { eq, and }) =>
            and(eq(utc.userId, USER.id), eq(utc.role, "admin")),
        },
      },
    });

    return Boolean(user);
  }
}
