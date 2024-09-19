/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  PreExecutionRule,
  UnauthorizedError,
  PostExecutionRule,
} from "@graphql-authz/core";
import { GraphQLError } from "graphql";

import { UserLoadable } from "~/schema/user/types";
import { GraphqlContext } from "~/types";

import { authHelpers } from "./helpers";

export class IsAuthenticated extends PreExecutionRule {
  error = new UnauthorizedError("User is not authenticated");
  public execute({ USER }: GraphqlContext) {
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

export class IsTicketOwner extends PreExecutionRule {
  error = new UnauthorizedError("Not authorized");
  public async execute(
    { USER, DB }: GraphqlContext,
    fieldArgs: { input: { id: string } },
  ) {
    if (!USER || !fieldArgs.input.id) {
      return false;
    }

    const IsTicketOwner = await DB.query.userTicketsSchema.findFirst({
      where: (utc, { eq, and }) =>
        and(eq(utc.userId, USER.id), eq(utc.id, fieldArgs.input.id)),
    });

    return Boolean(IsTicketOwner);
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

export class IsCommunityCollaborator extends PreExecutionRule {
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

export class IsCommunityAdmin extends PreExecutionRule {
  public async execute(
    { USER, DB }: GraphqlContext,
    fieldArgs: { input: { communityId: string } },
  ) {
    if (!USER || !fieldArgs?.input?.communityId) {
      return false;
    }

    const isCommunityAdmin = await authHelpers.isCommunityAdmin({
      userId: USER.id,
      communityId: fieldArgs.input.communityId,
      DB,
    });

    return Boolean(isCommunityAdmin);
  }
}

export class IsEventAdmin extends PreExecutionRule {
  public async execute(
    { USER, DB }: GraphqlContext,
    fieldArgs: { input: { eventId: string } },
  ) {
    if (!USER || !fieldArgs?.input?.eventId) {
      return false;
    }

    const isEventAdmin = await DB.query.eventsToUsersSchema.findFirst({
      where: (utc, { eq, and }) =>
        and(
          eq(utc.eventId, fieldArgs.input.eventId),
          eq(utc.userId, USER.id),
          eq(utc.role, "admin"),
        ),
    });

    return Boolean(isEventAdmin);
  }
}

export class CanApproveTicket extends PreExecutionRule {
  public async execute(
    { USER, DB }: GraphqlContext,
    fieldArgs: { userTicketId: string },
  ) {
    if (!USER || !fieldArgs?.userTicketId) {
      return false;
    }

    const userTicket = await DB.query.userTicketsSchema.findFirst({
      where: (utc, { eq }) => eq(utc.id, fieldArgs.userTicketId),
      with: {
        ticketTemplate: true,
      },
    });

    if (!userTicket) {
      throw new GraphQLError("Ticket not found");
    }

    if (USER.isSuperAdmin) {
      return true;
    }

    const isEventAdmin = await DB.query.eventsToUsersSchema.findFirst({
      where: (utc, { eq, and }) =>
        and(
          eq(utc.eventId, userTicket?.ticketTemplate.eventId),
          eq(utc.userId, USER.id),
          eq(utc.role, "admin"),
        ),
    });

    return Boolean(isEventAdmin);
  }
}

export class CanSeePersonalData extends PostExecutionRule {
  public async execute(
    ctx: GraphqlContext,
    fieldArgs: unknown,
    _: unknown,
    parent: {
      id: string;
    },
  ) {
    if (!ctx.USER) {
      return false;
    }

    if (ctx.USER.isSuperAdmin) {
      return true;
    }

    const loadedUser = await UserLoadable.getDataloader(ctx).load(parent.id);

    return loadedUser?.id === ctx.USER.id;
  }

  selectionSet = `{ id }`;
}
