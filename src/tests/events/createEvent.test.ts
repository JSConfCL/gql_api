import { it, describe, afterEach, assert, expect } from "vitest";
import {
  executeGraphqlOperation,
  findEventById,
  insertCommunity,
} from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  CreateEvent,
  CreateEventMutation,
  CreateEventMutationVariables,
  GetCommunityEvents,
  GetCommunityEventsQuery,
  GetCommunityEventsQueryVariables,
} from "./createEvent.generated";
import { EventStatus, EventVisibility } from "~/generated/types";
import { faker } from "@faker-js/faker";

afterEach(() => {
  clearDatabase();
});

describe("Event", () => {
  it("Should Create an event", async () => {
    const startDate = faker.date
      .future({
        years: 1,
      })
      .toISOString();
    const community = await insertCommunity();
    const response = await executeGraphqlOperation<
      CreateEventMutation,
      CreateEventMutationVariables
    >({
      document: CreateEvent,
      variables: {
        eventDescription: faker.lorem.paragraph(3),
        eventName: faker.lorem.words(3),
        startDateTime: startDate,
        communityId: community.id,
        visibility: EventVisibility.Public,
        endDateTime: faker.date
          .future({
            refDate: startDate,
          })
          .toISOString(),
      },
    });

    assert.equal(response.errors, undefined);
    const event = await findEventById(response?.data?.createEvent?.id);
    assert.equal(response.data?.createEvent.id, event.id);
    assert.equal(response.data?.createEvent.description, event.description);
  });
  it("Should associate an event to a community", async () => {
    const startDate = faker.date
      .future({
        years: 1,
      })
      .toISOString();
    const community = await insertCommunity();
    const response = await executeGraphqlOperation<
      CreateEventMutation,
      CreateEventMutationVariables
    >({
      document: CreateEvent,
      variables: {
        eventDescription: faker.lorem.paragraph(3),
        eventName: faker.lorem.words(3),
        startDateTime: startDate,
        communityId: community.id,
        visibility: EventVisibility.Public,
        endDateTime: faker.date
          .future({
            refDate: startDate,
          })
          .toISOString(),
      },
    });
    const communityResponse = await executeGraphqlOperation<
      GetCommunityEventsQuery,
      GetCommunityEventsQueryVariables
    >({
      document: GetCommunityEvents,
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
        eventDescription: faker.lorem.paragraph(3),
        eventName: faker.lorem.words(3),
        startDateTime: startDate,
        communityId: "NON ID",
        visibility: EventVisibility.Public,
        endDateTime: faker.date
          .future({
            refDate: startDate,
          })
          .toISOString(),
      },
    });

    assert.equal(response?.errors?.length, 1);
    await expect(
      findEventById(response?.data?.createEvent?.id),
    ).rejects.toThrow();
  });
});
