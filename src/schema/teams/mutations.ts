import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  insertTeamsSchema,
  insertUserTeamsSchema,
  selectTeamsSchema,
  teamsSchema,
  udpateUserTeamsSchema,
  updateTeamsSchema,
  UserParticipationStatusEnum,
  UserTeamRoleEnum,
  userTeamsSchema,
} from "~/datasources/db/schema";
import { addToObjectIfPropertyExists } from "~/schema/shared/helpers";
import { teamsFetcher } from "~/schema/teams/teamsFetcher";
import { AddUserToTeamResponseRef, TeamRef } from "~/schema/teams/types";
import { usersFetcher } from "~/schema/user/userFetcher";
import { createInactiveUser } from "~/schema/user/userHelpers";

const TeamCreateInput = builder.inputType("TeamCreateInput", {
  fields: (t) => ({
    eventId: t.string({
      required: true,
    }),
    name: t.string({
      required: true,
    }),
    description: t.string({
      required: false,
    }),
  }),
});

builder.mutationField("createTeam", (t) =>
  t.field({
    description: "Create a team, associated to a specific event",
    type: TeamRef,
    args: {
      input: t.arg({
        type: TeamCreateInput,
        required: true,
      }),
    },
    authz: {
      rules: ["IsSuperAdmin"],
    },
    resolve: async (root, { input }, { DB, USER }) => {
      if (!USER) {
        throw new GraphQLError("User not found");
      }

      const { eventId } = input;
      const event = await DB.query.eventsSchema.findFirst({
        where: (e, { eq }) => eq(e.id, eventId),
      });

      if (!event) {
        throw new GraphQLError("Event not found");
      }

      const hasCreatedATeam = await DB.query.userTeamsSchema.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.userId, USER.id), eq(t.role, UserTeamRoleEnum.leader)),
        with: {
          team: true,
        },
      });

      if (hasCreatedATeam && hasCreatedATeam.team?.eventId === eventId) {
        throw new GraphQLError(
          "You have already created a team for this event",
        );
      }

      const teamToInsert = insertTeamsSchema.parse({
        name: input.name,
        description: input.description,
        eventId: eventId,
      });

      const result = await DB.transaction(async (trx) => {
        const teams = await trx
          .insert(teamsSchema)
          .values(teamToInsert)
          .returning();
        const team = teams[0];

        if (!team) {
          throw new GraphQLError("Error creating team");
        }

        const userTeamToInsert = insertUserTeamsSchema.parse({
          userId: USER?.id,
          teamId: team.id,
          role: "leader",
          userParticipationStatus: UserParticipationStatusEnum.accepted,
        });

        await trx.insert(userTeamsSchema).values(userTeamToInsert).returning();

        return team;
      });
      const team = selectTeamsSchema.parse(result);

      return team;
    },
  }),
);

const AddPersonToTeamInput = builder.inputType("AddPersonToTeamInput", {
  fields: (t) => ({
    teamId: t.string({
      required: true,
    }),
    userEmail: t.field({
      type: "String",
      required: true,
    }),
  }),
});

builder.mutationField("addPersonToTeam", (t) =>
  t.field({
    description: "Try to add a person to a team",
    type: AddUserToTeamResponseRef,
    args: {
      input: t.arg({
        type: AddPersonToTeamInput,
        required: true,
      }),
    },
    authz: {
      rules: ["IsSuperAdmin"],
    },
    resolve: async (root, { input }, { USER, DB, logger }) => {
      const { teamId, userEmail } = input;

      if (!USER) {
        throw new GraphQLError("User not found");
      }

      const team = await teamsFetcher.getTeamForEdit({
        DB,
        teamId,
        userId: USER.id,
      });

      if (!team) {
        throw new GraphQLError(
          "You do not have permission to add someone to this team",
        );
      }

      if ((userEmail && userEmail.length === 0) || !userEmail) {
        throw new GraphQLError(
          "You need to pass an email to be able to add someone to a team",
        );
      }

      const users = await usersFetcher.searchUsers({
        DB,
        search: {
          email: userEmail,
        },
      });
      let user = users[0];

      if (!user) {
        user = await createInactiveUser({
          DB,
          email: userEmail,
          logger,
        });
      }

      const teamsAndUsers = await DB.query.userTeamsSchema.findFirst({
        where: (t, { eq }) => eq(t.userId, user.id),
        with: {
          team: true,
          user: true,
        },
      });

      if (teamsAndUsers?.teamId === teamId) {
        throw new GraphQLError("User is already in this team");
      }

      const userTeamToInsert = insertUserTeamsSchema.parse({
        userId: user.id,
        teamId: team.id,
        role: "member",
      });

      await DB.insert(userTeamsSchema).values(userTeamToInsert).returning();

      return {
        team: selectTeamsSchema.parse(team),
        userIsInOtherTeams: Boolean(teamsAndUsers),
      };
    },
  }),
);

const RemovePersonFromTeamInput = builder.inputType(
  "RemovePersonFromTeamInput",
  {
    fields: (t) => ({
      teamId: t.string({
        required: true,
      }),
      userId: t.field({
        type: "String",
        required: true,
      }),
    }),
  },
);

builder.mutationField("deletePersonFomTeam", (t) =>
  t.field({
    description: "Try to add a person to a team",
    type: TeamRef,
    args: {
      input: t.arg({
        type: RemovePersonFromTeamInput,
        required: true,
      }),
    },
    authz: {
      rules: ["IsSuperAdmin"],
    },
    resolve: async (root, { input }, { USER, DB }) => {
      const { teamId, userId } = input;

      if (!USER) {
        throw new GraphQLError("User not found");
      }

      const team = await teamsFetcher.getTeamForEdit({
        DB,
        teamId,
        userId: USER.id,
      });

      if (!team) {
        throw new GraphQLError(
          "You do not have permission to add someone to this team",
        );
      }

      await DB.delete(userTeamsSchema)
        .where(eq(userTeamsSchema.id, userId))
        .returning();

      return selectTeamsSchema.parse(team);
    },
  }),
);

const updateTeam = builder.inputType("UpdateTeamInput", {
  fields: (t) => ({
    teamId: t.string({
      required: true,
    }),
    name: t.string({
      required: false,
    }),
    description: t.string({
      required: false,
    }),
  }),
});

builder.mutationField("updateTeam", (t) =>
  t.field({
    description: "Updates a team information",
    type: TeamRef,
    args: {
      input: t.arg({
        type: updateTeam,
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { input }, { USER, DB }) => {
      const { teamId, name, description } = input;

      if (!USER) {
        throw new GraphQLError("User not found");
      }

      const team = await teamsFetcher.getTeamForEdit({
        DB,
        teamId,
        userId: USER.id,
      });

      if (!team) {
        throw new GraphQLError("You do not have permission to edit this team");
      }

      const properties = {};

      addToObjectIfPropertyExists(properties, "name", name);

      addToObjectIfPropertyExists(properties, "description", description);

      const teamToUpdate = updateTeamsSchema.parse(properties);

      const udpatedTeam = await DB.update(teamsSchema)
        .set(teamToUpdate)
        .where(eq(teamsSchema.id, teamId))
        .returning();

      return selectTeamsSchema.parse(udpatedTeam[0]);
    },
  }),
);

const acceptTeamInvitationInput = builder.inputType(
  "AcceptTeamInvitationInput",
  {
    fields: (t) => ({
      teamId: t.string({
        required: true,
      }),
    }),
  },
);

builder.mutationField("acceptTeamInvitation", (t) =>
  t.field({
    description: "Accept the user's invitation to a team",
    type: TeamRef,
    args: {
      input: t.arg({
        type: acceptTeamInvitationInput,
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { input }, { USER, DB }) => {
      const { teamId } = input;

      if (!USER) {
        throw new GraphQLError("User not found");
      }

      const teamAndUsers = await DB.query.userTeamsSchema.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.teamId, teamId), eq(t.userId, USER.id)),
        with: {
          team: true,
          user: true,
        },
      });
      const team = teamAndUsers?.team;

      if (!team) {
        throw new GraphQLError("You do not have permission to edit this team");
      }

      const teamToUpdate = udpateUserTeamsSchema.parse({
        userParticipationStatus: UserParticipationStatusEnum.accepted,
      });

      await DB.update(userTeamsSchema)
        .set(teamToUpdate)
        .where(eq(userTeamsSchema.id, teamAndUsers?.id));

      return team;
    },
  }),
);

const rejectTeamInvitationInput = builder.inputType(
  "RejectTeamInvitationInput",
  {
    fields: (t) => ({
      teamId: t.string({
        required: true,
      }),
    }),
  },
);

builder.mutationField("rejectTeamInvitation", (t) =>
  t.field({
    description: "Reject the user's invitation to a team",
    type: TeamRef,
    args: {
      input: t.arg({
        type: rejectTeamInvitationInput,
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { input }, { USER, DB }) => {
      const { teamId } = input;

      if (!USER) {
        throw new GraphQLError("User not found");
      }

      const teamAndUsers = await DB.query.userTeamsSchema.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.teamId, teamId), eq(t.userId, USER.id)),
        with: {
          team: true,
          user: true,
        },
      });
      const team = teamAndUsers?.team;

      if (!team) {
        throw new GraphQLError("You do not have permission to edit this team");
      }

      const teamToUpdate = udpateUserTeamsSchema.parse({
        userParticipationStatus: UserParticipationStatusEnum.not_accepted,
      });

      await DB.update(userTeamsSchema)
        .set(teamToUpdate)
        .where(eq(userTeamsSchema.id, teamAndUsers?.id));

      return team;
    },
  }),
);
