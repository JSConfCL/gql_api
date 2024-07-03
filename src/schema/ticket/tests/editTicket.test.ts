import { faker } from "@faker-js/faker";
import { it, describe, assert } from "vitest";

import {
  TicketEditInput,
  TicketTemplateStatus,
  TicketTemplateVisibility,
} from "~/generated/types";
import {
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertTicketTemplate,
  insertUser,
  insertUserToCommunity,
  toISODateWithoutMilliseconds,
} from "~/tests/fixtures";

import {
  EditTicket,
  EditTicketMutation,
  EditTicketMutationVariables,
} from "./editTicket.generated";

describe("User", () => {
  it("Should update a ticket, all fields", async () => {
    const user1 = await insertUser({
      isSuperAdmin: true,
    });
    const community1 = await insertCommunity();
    const event1 = await insertEvent();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "member",
    });
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
    });

    const startDateTime = faker.date.future();
    const endDateTime = faker.date.future();

    const fakeInput = {
      ticketId: ticket.id,
      name: faker.word.words(3),
      description: faker.lorem.paragraph(3),
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      requiresApproval: false,
      unlimitedTickets: true,
      quantity: 100,
      status: TicketTemplateStatus.Active,
      visibility: TicketTemplateVisibility.Public,
      eventId: event1.id,
    } satisfies TicketEditInput;

    const response = await executeGraphqlOperationAsUser<
      EditTicketMutation,
      EditTicketMutationVariables
    >(
      {
        document: EditTicket,
        variables: {
          input: {
            ...fakeInput,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.editTicket, {
      id: ticket.id,
      name: fakeInput.name,
      description: fakeInput.description,
      startDateTime: toISODateWithoutMilliseconds(startDateTime),
      endDateTime: toISODateWithoutMilliseconds(endDateTime),
      requiresApproval: fakeInput.requiresApproval,
      status: fakeInput.status,
      visibility: fakeInput.visibility,
      event: {
        id: event1.id,
      },
      isUnlimited: false,
      quantity: 100,
    });
  });
  it("Should update a ticket, only one field", async () => {
    const user1 = await insertUser({
      isSuperAdmin: true,
    });
    const community1 = await insertCommunity();
    const event1 = await insertEvent();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "member",
    });
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
    });

    const input = {
      name: faker.word.words(3),
      ticketId: ticket.id,
    };

    const response = await executeGraphqlOperationAsUser<
      EditTicketMutation,
      EditTicketMutationVariables
    >(
      {
        document: EditTicket,
        variables: {
          input,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.editTicket, {
      id: ticket.id,
      name: input.name,
      description: ticket.description,
      startDateTime: ticket.startDateTime.toISOString(),
      endDateTime: ticket.endDateTime?.toISOString() || null,
      requiresApproval: ticket.requiresApproval,
      quantity: ticket.quantity || null,
      status: ticket.status as TicketTemplateStatus,
      visibility: ticket.visibility as TicketTemplateVisibility,
      event: {
        id: event1.id,
      },
      isUnlimited: false,
    });
  });
  it("Should update a ticket is community admin", async () => {
    const user1 = await insertUser();
    const community1 = await insertCommunity();
    const event1 = await insertEvent();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
    });

    const input = {
      name: faker.word.words(3),
      ticketId: ticket.id,
    };

    const response = await executeGraphqlOperationAsUser<
      EditTicketMutation,
      EditTicketMutationVariables
    >(
      {
        document: EditTicket,
        variables: {
          input,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.editTicket, {
      id: ticket.id,
      name: input.name,
      description: ticket.description,
      startDateTime: ticket.startDateTime.toISOString(),
      endDateTime: ticket.endDateTime?.toISOString() || null,
      requiresApproval: ticket.requiresApproval,
      quantity: ticket.quantity,
      status: ticket.status as TicketTemplateStatus,
      visibility: ticket.visibility as TicketTemplateVisibility,
      event: {
        id: event1.id,
      },
      isUnlimited: false,
    });
  });
  it("It should throw an error, if don't have permission", async () => {
    const user1 = await insertUser();
    const community1 = await insertCommunity();
    const event1 = await insertEvent();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "member",
    });
    const ticket = await insertTicketTemplate({
      eventId: event1.id,
    });

    const response = await executeGraphqlOperationAsUser<
      EditTicketMutation,
      EditTicketMutationVariables
    >(
      {
        document: EditTicket,
        variables: {
          input: {
            ticketId: ticket.id,
            name: faker.word.words(3),
            eventId: event1.id,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors?.[0].message, "Not authorized");
  });
});
