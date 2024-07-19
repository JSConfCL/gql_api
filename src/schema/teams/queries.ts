import { builder } from "~/builder";
import { selectTeamsSchema } from "~/datasources/db/teams";
import {
  createPaginationInputType,
  createPaginationObjectType,
} from "~/schema/pagination/types";
import { TeamRef } from "~/schema/shared/refs";
import { teamsFetcher } from "~/schema/teams/teamsFetcher";
import { TeamStatus } from "~/schema/teams/types";

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

      const { data, pagination } = await teamsFetcher.getPaginatedTeams({
        DB,
        pagination: input.pagination,
        search: {
          teamName: name ?? undefined,
          eventIds: eventIds ?? undefined,
          teamIds: teamIds ?? undefined,
          status: status ?? undefined,
          userIds: userIds ?? undefined,
        },
      });

      return {
        data: data.map((t) => selectTeamsSchema.parse(t)),
        pagination,
      };
    },
  }),
);
