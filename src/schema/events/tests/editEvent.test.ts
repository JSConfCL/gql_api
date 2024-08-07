import { faker } from "@faker-js/faker";
import { it, describe, assert, expect } from "vitest";

import { EventVisibility } from "~/generated/types";
import {
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  findEventById,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertUser,
  insertUserToCommunity,
  toISODate,
} from "~/tests/fixtures";

import {
  EditEvent,
  EditEventMutation,
  EditEventMutationVariables,
} from "./editEvent.generated";

describe("Event", () => {
  describe("Should edit an event", () => {
    it("As an admin", async () => {
      const user1 = await insertUser();
      const community = await insertCommunity();
      const event = await insertEvent({
        visibility: EventVisibility.Private,
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
      const newStartDateTime = faker.date.future({
        years: 1,
      });
      const newEndDateTime = faker.date.future({
        refDate: newStartDateTime,
        years: 1,
      });

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
              startDateTime: newStartDateTime.toISOString(),
              visibility: EventVisibility.Public,
              endDateTime: newEndDateTime.toISOString(),
            },
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.editEvent.id, event.id);

      assert.equal(response.data?.editEvent.description, newDescription);

      assert.equal(response.data?.editEvent.name, newName);

      assert.equal(
        response.data?.editEvent.startDateTime,
        toISODate(newStartDateTime),
      );

      assert.equal(
        response.data?.editEvent.endDateTime,
        toISODate(newEndDateTime),
      );
    });

    it("As a super-admin", async () => {
      const user1 = await insertUser();
      const community = await insertCommunity();
      const event = await insertEvent({
        visibility: EventVisibility.Private,
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
      const newStartDateTime = faker.date.future({
        years: 1,
      });
      const newEndDateTime = faker.date.future({
        refDate: newStartDateTime,
        years: 1,
      });

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
            startDateTime: newStartDateTime.toISOString(),
            visibility: EventVisibility.Public,
            endDateTime: newEndDateTime.toISOString(),
          },
        },
      });

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.editEvent.id, event.id);

      assert.equal(response.data?.editEvent.description, newDescription);

      assert.equal(response.data?.editEvent.name, newName);

      assert.equal(
        response.data?.editEvent.startDateTime,
        toISODate(newStartDateTime),
      );

      assert.equal(
        response.data?.editEvent.endDateTime,
        toISODate(newEndDateTime),
      );
    });
  });

  describe("Should fail to edit an event", () => {
    it("As normal user", async () => {
      const user1 = await insertUser();
      const community = await insertCommunity();
      const event = await insertEvent({
        visibility: EventVisibility.Private,
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
