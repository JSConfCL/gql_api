import { builder } from "~/builder";
import { selectUsersSchema, TeamStatusEnum } from "~/datasources/db/schema";
import { EventLoadable } from "~/schema/events/types";
import { TeamRef, UserRef } from "~/schema/shared/refs";

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
      resolve: async (root, args, ctx) => {
        const teamStatus = await ctx.DB.query.userTeamsSchema.findFirst({
          where: (t, { eq }) => eq(t.teamId, root.id),
        });

        if (!teamStatus || !teamStatus.status) {
          return TeamStatusEnum.waiting_resolution;
        }

        return teamStatus.status;
      },
    }),
    users: t.field({
      type: [UserRef],
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

        return teamWithUsers.map((tu) => selectUsersSchema.parse(tu.user));
      },
    }),
  }),
});
