import { faker } from "@faker-js/faker";
import { it, describe, assert, expect } from "vitest";

import { EventStatus, EventVisibility } from "~/generated/types";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  findEventById,
  insertCommunity,
  insertUser,
  insertUserToCommunity,
} from "~/tests/fixtures";

import {
  CreateEvent,
  CreateEventMutation,
  CreateEventMutationVariables,
  CommunityEvents,
  CommunityEventsQuery,
  CommunityEventsQueryVariables,
} from "./createEvent.generated";

describe("Event", () => {
  describe("Should create an event", () => {
    it("As an admin", async () => {
      const startDate = faker.date
        .future({
          years: 1,
        })
        .toISOString();
      const user1 = await insertUser();
      const community = await insertCommunity();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user1.id,
        role: "admin",
      });
      const response = await executeGraphqlOperationAsUser<
        CreateEventMutation,
        CreateEventMutationVariables
      >(
        {
          document: CreateEvent,
          variables: {
            input: {
              description: faker.lorem.paragraph(3),
              name: faker.lorem.words(3),
              startDateTime: startDate,
              communityId: community.id,
              visibility: EventVisibility.Public,
              maxAttendees: 10,
              endDateTime: faker.date
                .future({
                  refDate: startDate,
                })
                .toISOString(),
            },
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      const event = await findEventById(response?.data?.createEvent?.id);

      assert.equal(response.data?.createEvent.id, event.id);
      assert.equal(response.data?.createEvent.description, event.description);
    });
    it("As a super-admin", async () => {
      const startDate = faker.date
        .future({
          years: 1,
        })
        .toISOString();
      const community = await insertCommunity();
      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateEventMutation,
        CreateEventMutationVariables
      >({
        document: CreateEvent,
        variables: {
          input: {
            description: faker.lorem.paragraph(3),
            name: faker.lorem.words(3),
            startDateTime: startDate,
            communityId: community.id,
            visibility: EventVisibility.Public,
            maxAttendees: 10,
            endDateTime: faker.date
              .future({
                refDate: startDate,
              })
              .toISOString(),
          },
        },
      });

      assert.equal(response.errors, undefined);
      const event = await findEventById(response?.data?.createEvent?.id);

      assert.equal(response.data?.createEvent.id, event.id);
      assert.equal(response.data?.createEvent.description, event.description);
    });
  });
  describe("Should fail to create an event", () => {
    it("As normal user", async () => {
      const startDate = faker.date
        .future({
          years: 1,
        })
        .toISOString();
      const user1 = await insertUser();
      const community = await insertCommunity();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user1.id,
        role: "member",
      });
      const response = await executeGraphqlOperationAsUser<
        CreateEventMutation,
        CreateEventMutationVariables
      >(
        {
          document: CreateEvent,
          variables: {
            input: {
              description: faker.lorem.paragraph(3),
              name: faker.lorem.words(3),
              startDateTime: startDate,
              communityId: community.id,
              visibility: EventVisibility.Public,
              maxAttendees: 10,
              endDateTime: faker.date
                .future({
                  refDate: startDate,
                })
                .toISOString(),
            },
          },
        },
        user1,
      );

      assert.equal(response.errors?.length, 1);
      assert.equal(response.errors?.[0]?.message, "FORBIDDEN");
    });
    it("As collaborator", async () => {
      const startDate = faker.date
        .future({
          years: 1,
        })
        .toISOString();
      const user1 = await insertUser();
      const community = await insertCommunity();

      await insertUserToCommunity({
        communityId: community.id,
        userId: user1.id,
        role: "collaborator",
      });
      const response = await executeGraphqlOperationAsUser<
        CreateEventMutation,
        CreateEventMutationVariables
      >(
        {
          document: CreateEvent,
          variables: {
            input: {
              description: faker.lorem.paragraph(3),
              name: faker.lorem.words(3),
              startDateTime: startDate,
              communityId: community.id,
              visibility: EventVisibility.Public,
              maxAttendees: 10,
              endDateTime: faker.date
                .future({
                  refDate: startDate,
                })
                .toISOString(),
            },
          },
        },
        user1,
      );

      assert.equal(response.errors?.length, 1);
      assert.equal(response.errors?.[0]?.message, "FORBIDDEN");
    });
  });

  it("Should associate an event to a community", async () => {
    const startDate = faker.date
      .future({
        years: 1,
      })
      .toISOString();
    const community = await insertCommunity();
    const response = await executeGraphqlOperationAsSuperAdmin<
      CreateEventMutation,
      CreateEventMutationVariables
    >({
      document: CreateEvent,
      variables: {
        input: {
          description: faker.lorem.paragraph(3),
          name: faker.lorem.words(3),
          startDateTime: startDate,
          communityId: community.id,
          visibility: EventVisibility.Public,
          maxAttendees: 10,
          endDateTime: faker.date
            .future({
              refDate: startDate,
            })
            .toISOString(),
        },
      },
    });
    const communityResponse = await executeGraphqlOperation<
      CommunityEventsQuery,
      CommunityEventsQueryVariables
    >({
      document: CommunityEvents,
      variables: {
        communityId: community.id,
      },
    });

    if (!response.data) {
      throw new Error("No data");
    }

    if (!communityResponse.data) {
      throw new Error("No data");
    }

    assert.equal(response.errors, undefined);
    assert.equal(communityResponse.errors, undefined);
    assert.equal(communityResponse.data.community?.events?.length, 1);
    assert.deepEqual(communityResponse.data.community?.events?.at(0), {
      id: response.data.createEvent.id,
      name: response.data.createEvent.name,
      visibility: EventVisibility.Public,
      status: EventStatus.Inactive,
    });
  });
  it("Should error on non existing community", async () => {
    const startDate = faker.date
      .future({
        years: 1,
      })
      .toISOString();
    const response = await executeGraphqlOperation<
      CreateEventMutation,
      CreateEventMutationVariables
    >({
      document: CreateEvent,
      variables: {
        input: {
          description: faker.lorem.paragraph(3),
          name: faker.lorem.words(3),
          startDateTime: startDate,
          communityId: "NON ID",
          visibility: EventVisibility.Public,
          maxAttendees: 10,
          endDateTime: faker.date
            .future({
              refDate: startDate,
            })
            .toISOString(),
        },
      },
    });

    assert.equal(response?.errors?.length, 1);
    await expect(
      findEventById(response?.data?.createEvent?.id),
    ).rejects.toThrow();
  });
});
