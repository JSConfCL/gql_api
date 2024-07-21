import { z } from "zod";

import { builder } from "~/builder";
import {
  selectTeamsSchema,
  selectUsersSchema,
  UserParticipationStatusEnum,
} from "~/datasources/db/schema";
import { EventLoadable } from "~/schema/events/types";
import { UserGraphqlSchema } from "~/schema/shared/refs";

type TeamGraphqlSchema = z.infer<typeof selectTeamsSchema>;

export const TeamRef = builder.objectRef<TeamGraphqlSchema>("TeamRef");

export const AddUserToTeamResponseRef = builder.objectRef<{
  team: TeamGraphqlSchema;
  userIsInOtherTeams: boolean;
}>("TeamRef");

export const UserWithStatusRef = builder.objectRef<{
  user: UserGraphqlSchema;
  status: UserParticipationStatusEnum;
}>("UserWithStatusRef");

export const TeamStatus = builder.enumType(UserParticipationStatusEnum, {
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
    status: t.exposeString("teamStatus"),
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
            user: selectUsersSchema.parse(tu.user),
            status: tu.userParticipationStatus,
          };
        });
      },
    }),
  }),
});
