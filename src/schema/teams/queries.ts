import { builder } from "~/builder";
import {
  createPaginationInputType,
  createPaginationObjectType,
} from "~/schema/pagination/types";
import { teamsFetcher } from "~/schema/teams/teamsFetcher";
import { TeamRef, TeamStatus } from "~/schema/teams/types";
import {
  selectTeamsSchema,
  TeamStatusEnum,
} from "~workers/db_service/db/schema";

const PaginatedTeamRef = createPaginationObjectType(TeamRef);

const TeamSearchValues = builder.inputType("TeamSearchValues", {
  fields: (t) => ({
    name: t.field({
      type: "String",
      required: false,
    }),
    eventIds: t.field({
      type: ["String"],
      required: false,
    }),
    teamIds: t.field({
      type: ["String"],
      required: false,
    }),
    status: t.field({
      type: [TeamStatus],
      required: false,
    }),
    userIds: t.field({
      type: ["String"],
      required: false,
    }),
  }),
});

builder.queryField("searchTeams", (t) =>
  t.field({
    type: PaginatedTeamRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: createPaginationInputType(t, TeamSearchValues),
    resolve: async (root, { input }, { DB, USER }) => {
      const { eventIds, teamIds, name, status, userIds } = input.search ?? {};

      if (!USER) {
        throw new Error("User not found");
      }

      const requestedUserIds = userIds ?? [USER.id];
      const requestedStatus = status ?? [
        TeamStatusEnum.invited,
        TeamStatusEnum.accepted,
      ];

      const { data, pagination } = await teamsFetcher.getPaginatedTeams({
        DB,
        pagination: input.pagination,
        search: {
          teamName: name ?? undefined,
          eventIds: eventIds ?? undefined,
          teamIds: teamIds ?? undefined,
          status: requestedStatus,
          userIds: USER.isSuperAdmin ? requestedUserIds : [USER.id],
        },
      });

      return {
        data: data.map((t) => selectTeamsSchema.parse(t)),
        pagination,
      };
    },
  }),
);
