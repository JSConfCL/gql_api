import { faker } from "@faker-js/faker";
import { it, describe, assert, expect } from "vitest";

import {
  TeamStatus,
  UserTeamRole,
  ParticipationStatus,
} from "~/generated/types";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  findTeamById,
  insertEvent,
  insertUser,
  insertUserToEvent,
} from "~/tests/fixtures";

import {
  CreateTeam,
  CreateTeamMutation,
  CreateTeamMutationVariables,
} from "./createTeam.generated";

describe("Team", () => {
  describe("Should create a team", () => {
    it("As an admin", async () => {
      const user1 = await insertUser();
      const event = await insertEvent();

      await insertUserToEvent({
        eventId: event.id,
        userId: user1.id,
        role: "admin",
      });
      const response = await executeGraphqlOperationAsUser<
        CreateTeamMutation,
        CreateTeamMutationVariables
      >(
        {
          document: CreateTeam,
          variables: {
            input: {
              description: faker.lorem.paragraph(3),
              name: faker.lorem.words(3),
              eventId: event.id,
            },
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      const team = await findTeamById(response?.data?.createTeam?.id);

      assert.equal(response.data?.createTeam.id, team.id);
      assert.equal(response.data?.createTeam.description, team.description);
    });
    it("As a super-admin", async () => {
      const event = await insertEvent();
      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateTeamMutation,
        CreateTeamMutationVariables
      >({
        document: CreateTeam,
        variables: {
          input: {
            description: faker.lorem.paragraph(3),
            name: faker.lorem.words(3),
            eventId: event.id,
          },
        },
      });

      assert.equal(response.errors, undefined);
      const team = await findTeamById(response?.data?.createTeam?.id);

      assert.equal(response.data?.createTeam.id, team.id);
      assert.equal(response.data?.createTeam.description, team.description);
    });
  });
  it("Should error on creating a second team", async () => {
    const event = await insertEvent();
    const user = await insertUser();

    // Create the first team
    await executeGraphqlOperationAsUser<
      CreateTeamMutation,
      CreateTeamMutationVariables
    >(
      {
        document: CreateTeam,
        variables: {
          input: {
            description: faker.lorem.paragraph(3),
            name: faker.lorem.words(3),
            eventId: event.id,
          },
        },
      },
      user,
    );

    // Attempt to create a second team for the same event
    const response = await executeGraphqlOperationAsUser<
      CreateTeamMutation,
      CreateTeamMutationVariables
    >(
      {
        document: CreateTeam,
        variables: {
          input: {
            description: faker.lorem.paragraph(3),
            name: faker.lorem.words(3),
            eventId: event.id,
          },
        },
      },
      user,
    );

    assert.equal(response?.errors?.length, 1);
    assert.equal(
      response?.errors?.[0]?.message,
      "You have already created a team for this event",
    );
  });
  it("Should error on non existing event", async () => {
    const response = await executeGraphqlOperation<
      CreateTeamMutation,
      CreateTeamMutationVariables
    >({
      document: CreateTeam,
      variables: {
        input: {
          description: faker.lorem.paragraph(3),
          name: faker.lorem.words(3),
          eventId: "NON ID",
        },
      },
    });

    assert.equal(response?.errors?.length, 1);
    await expect(
      findTeamById(response?.data?.createTeam?.id),
    ).rejects.toThrow();
  });
});
