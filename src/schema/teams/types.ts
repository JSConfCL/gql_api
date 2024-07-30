import { z } from "zod";

import { builder } from "~/builder";
import {
  selectTeamsSchema,
  selectUsersSchema,
  TeamStatusEnum,
  UserParticipationStatusEnum,
  UserTeamRoleEnum,
} from "~/datasources/db/schema";
import { EventLoadable } from "~/schema/events/types";
import { UserGraphqlSchema, UserRef } from "~/schema/shared/refs";

type TeamGraphqlSchema = z.infer<typeof selectTeamsSchema>;

export const TeamRef = builder.objectRef<TeamGraphqlSchema>("TeamRef");

export const AddUserToTeamResponseRef = builder.objectRef<{
  team: TeamGraphqlSchema;
  userIsInOtherTeams: boolean;
}>("AddUserToTeamResponseRef");

builder.objectType(AddUserToTeamResponseRef, {
  description: "Response when adding a user to a team",
  fields: (t) => ({
    team: t.field({
      type: TeamRef,
      resolve: (root) => root.team,
    }),
    userIsInOtherTeams: t.exposeBoolean("userIsInOtherTeams"),
  }),
});

export const ParticipationStatus = builder.enumType(
  UserParticipationStatusEnum,
  {
    name: "ParticipationStatus",
  },
);

export const UserTeamRole = builder.enumType(UserTeamRoleEnum, {
  name: "UserTeamRole",
});

export const UserWithStatusRef = builder.objectRef<{
  id: string;
  user: UserGraphqlSchema;
  role: UserTeamRoleEnum;
  status: UserParticipationStatusEnum;
}>("UserWithStatusRef");

builder.objectType(UserWithStatusRef, {
  description: "Representation of a user in a team",
  fields: (t) => ({
    id: t.exposeID("id"),
    user: t.field({
      type: UserRef,
      resolve: (root) => root.user,
    }),
    role: t.field({
      type: UserTeamRole,
      resolve: (root) => root.role,
    }),
    status: t.field({
      type: ParticipationStatus,
      resolve: (root) => root.status,
    }),
  }),
});

export const TeamStatus = builder.enumType(TeamStatusEnum, {
  name: "TeamStatus",
});

builder.objectType(TeamRef, {
  description:
    "Representation of a team. This is compsed of a group of users and is attached to a specific event",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    event: t.field({
      type: EventLoadable,
      resolve: (root) => root.eventId,
    }),
    status: t.field({
      type: TeamStatus,
      resolve: (root) => root.teamStatus,
    }),
    users: t.field({
      type: [UserWithStatusRef],
      resolve: async (root, args, ctx) => {
        // TODO: Use a dataloader here

        const teamWithUsers = await ctx.DB.query.userTeamsSchema.findMany({
          where: (uts, { eq }) => eq(uts.teamId, root.id),
          with: {
            user: true,
          },
        });

        if (!teamWithUsers) {
          return [];
        }

        return teamWithUsers.map((tu) => {
          return {
            id: tu.userId,
            user: selectUsersSchema.parse(tu.user),
            role: tu.role,
            status: tu.userParticipationStatus,
          };
        });
      },
    }),
  }),
});
