import { it, describe, afterEach, assert, expect } from "vitest";
import {
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  findEventById,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertUser,
  insertUserToCommunity,
} from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  EditEvent,
  EditEventMutation,
  EditEventMutationVariables,
} from "./editEvent.generated";
import { EventVisibility } from "~/generated/types";
import { faker } from "@faker-js/faker";

afterEach(() => {
  clearDatabase();
});

describe("Event", () => {
  describe("Should edit an event", () => {
    it("As an admin", async () => {
      const user1 = await insertUser();
      const community = await insertCommunity();
      const event = await insertEvent({
        visibility: EventVisibility.Private,
        maxAttendees: 5,
      });
      await insertUserToCommunity({
        communityId: community.id,
        userId: user1.id,
        role: "admin",
      });
      await insertEventToCommunity({
        communityId: community.id,
        eventId: event.id,
      });
      const newDescription = faker.lorem.paragraph(3);
      const newName = faker.lorem.paragraph(3);
      const newStartDateTime = faker.date
        .future({
          years: 1,
        })
        .toISOString();
      const newEndDateTime = faker.date
        .future({
          refDate: newStartDateTime,
          years: 1,
        })
        .toISOString();

      const response = await executeGraphqlOperationAsUser<
        EditEventMutation,
        EditEventMutationVariables
      >(
        {
          document: EditEvent,
          variables: {
            input: {
              eventId: event.id,
              description: newDescription,
              name: newName,
              startDateTime: newStartDateTime,
              visibility: EventVisibility.Public,
              maxAttendees: 10,
              endDateTime: newEndDateTime,
            },
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(response.data?.editEvent.id, event.id);
      assert.equal(response.data?.editEvent.description, newDescription);
      assert.equal(response.data?.editEvent.name, newName);
      assert.equal(response.data?.editEvent.startDateTime, newStartDateTime);
      assert.equal(response.data?.editEvent.endDateTime, newEndDateTime);
    });
    it("As a super-admin", async () => {
      const user1 = await insertUser();
      const community = await insertCommunity();
      const event = await insertEvent({
        visibility: EventVisibility.Private,
        maxAttendees: 5,
      });
      await insertUserToCommunity({
        communityId: community.id,
        userId: user1.id,
        role: "admin",
      });
      await insertEventToCommunity({
        communityId: community.id,
        eventId: event.id,
      });
      const newDescription = faker.lorem.paragraph(3);
      const newName = faker.lorem.paragraph(3);
      const newStartDateTime = faker.date
        .future({
          years: 1,
        })
        .toISOString();
      const newEndDateTime = faker.date
        .future({
          refDate: newStartDateTime,
          years: 1,
        })
        .toISOString();

      const response = await executeGraphqlOperationAsSuperAdmin<
        EditEventMutation,
        EditEventMutationVariables
      >({
        document: EditEvent,
        variables: {
          input: {
            eventId: event.id,
            description: newDescription,
            name: newName,
            startDateTime: newStartDateTime,
            visibility: EventVisibility.Public,
            maxAttendees: 10,
            endDateTime: newEndDateTime,
          },
        },
      });

      assert.equal(response.errors, undefined);
      assert.equal(response.data?.editEvent.id, event.id);
      assert.equal(response.data?.editEvent.description, newDescription);
      assert.equal(response.data?.editEvent.name, newName);
      assert.equal(response.data?.editEvent.startDateTime, newStartDateTime);
      assert.equal(response.data?.editEvent.endDateTime, newEndDateTime);
    });
  });
  describe("Should fail to edit an event", () => {
    it("As normal user", async () => {
      const user1 = await insertUser();
      const community = await insertCommunity();
      const event = await insertEvent({
        visibility: EventVisibility.Private,
        maxAttendees: 5,
      });
      await insertUserToCommunity({
        communityId: community.id,
        userId: user1.id,
        role: "member",
      });
      await insertEventToCommunity({
        communityId: community.id,
        eventId: event.id,
      });
      const newDescription = faker.lorem.paragraph(3);
      const newName = faker.lorem.paragraph(3);
      const newStartDateTime = faker.date
        .future({
          years: 1,
        })
        .toISOString();
      const newEndDateTime = faker.date
        .future({
          refDate: newStartDateTime,
          years: 1,
        })
        .toISOString();

      const response = await executeGraphqlOperationAsUser<
        EditEventMutation,
        EditEventMutationVariables
      >(
        {
          document: EditEvent,
          variables: {
            input: {
              eventId: event.id,
              description: newDescription,
              name: newName,
              startDateTime: newStartDateTime,
              visibility: EventVisibility.Public,
              maxAttendees: 10,
              endDateTime: newEndDateTime,
            },
          },
        },
        user1,
      );

      assert.equal(response.errors?.length, 1);
      assert.equal(response.errors?.[0]?.message, "FORBIDDEN");
    });
    it("As collaborator", async () => {
      const user1 = await insertUser();
      const community = await insertCommunity();
      const event = await insertEvent({
        visibility: EventVisibility.Private,
        maxAttendees: 5,
      });
      await insertUserToCommunity({
        communityId: community.id,
        userId: user1.id,
        role: "collaborator",
      });
      await insertEventToCommunity({
        communityId: community.id,
        eventId: event.id,
      });
      const newDescription = faker.lorem.paragraph(3);
      const newName = faker.lorem.paragraph(3);
      const newStartDateTime = faker.date
        .future({
          years: 1,
        })
        .toISOString();
      const newEndDateTime = faker.date
        .future({
          refDate: newStartDateTime,
          years: 1,
        })
        .toISOString();

      const response = await executeGraphqlOperationAsUser<
        EditEventMutation,
        EditEventMutationVariables
      >(
        {
          document: EditEvent,
          variables: {
            input: {
              eventId: event.id,
              description: newDescription,
              name: newName,
              startDateTime: newStartDateTime,
              visibility: EventVisibility.Public,
              maxAttendees: 10,
              endDateTime: newEndDateTime,
            },
          },
        },
        user1,
      );

      assert.equal(response.errors?.length, 1);
      assert.equal(response.errors?.[0]?.message, "FORBIDDEN");
    });
  });

  it("Should error on non existing event", async () => {
    const user1 = await insertUser();
    const community = await insertCommunity();
    const event = await insertEvent({
      visibility: EventVisibility.Private,
      maxAttendees: 5,
    });
    await insertUserToCommunity({
      communityId: community.id,
      userId: user1.id,
      role: "admin",
    });
    await insertEventToCommunity({
      communityId: community.id,
      eventId: event.id,
    });
    const newDescription = faker.lorem.paragraph(3);
    const newName = faker.lorem.paragraph(3);
    const newStartDateTime = faker.date
      .future({
        years: 1,
      })
      .toISOString();
    const newEndDateTime = faker.date
      .future({
        refDate: newStartDateTime,
        years: 1,
      })
      .toISOString();

    const response = await executeGraphqlOperationAsUser<
      EditEventMutation,
      EditEventMutationVariables
    >(
      {
        document: EditEvent,
        variables: {
          input: {
            eventId: "DUMMY ID",
            description: newDescription,
            name: newName,
            startDateTime: newStartDateTime,
            visibility: EventVisibility.Public,
            maxAttendees: 10,
            endDateTime: newEndDateTime,
          },
        },
      },
      user1,
    );

    assert.equal(response?.errors?.length, 1);
    await expect(
      findEventById(response?.data?.editEvent?.id),
    ).rejects.toThrow();
  });
});
