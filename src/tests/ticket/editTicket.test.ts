import { it, describe, assert } from "vitest";
import {
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertTicketTemplate,
  insertUser,
  insertUserToCommunity,
  toISODateWithoutMilliseconds,
} from "~/tests/__fixtures";
import { faker } from "@faker-js/faker";
import {
  EditTicket,
  EditTicketMutation,
  EditTicketMutationVariables,
} from "./editTicket.generated";
import {
  TicketTemplateStatus,
  TicketTemplateVisibility,
} from "~/generated/types";

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
      name: faker.word.words(3),
      description: faker.lorem.paragraph(3),
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      requiresApproval: false,
      price: faker.number.int({
        min: 1,
        max: 100,
      }),
      quantity: faker.number.int({
        min: 1,
        max: 100,
      }),
      status: TicketTemplateStatus.Active,
      visibility: TicketTemplateVisibility.Public,
      eventId: event1.id,
    };

    const response = await executeGraphqlOperationAsUser<
      EditTicketMutation,
      EditTicketMutationVariables
    >(
      {
        document: EditTicket,
        variables: {
          input: {
            ticketId: ticket.id,
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
      price: fakeInput.price,
      quantity: fakeInput.quantity,
      status: fakeInput.status,
      visibility: fakeInput.visibility,
      eventId: event1.id,
      currencyId: ticket.currencyId,
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

    const fakeInput = {
      name: faker.word.words(3),
    };

    const response = await executeGraphqlOperationAsUser<
      EditTicketMutation,
      EditTicketMutationVariables
    >(
      {
        document: EditTicket,
        variables: {
          input: {
            ticketId: ticket.id,
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
      description: ticket.description,
      startDateTime: ticket.startDateTime.toISOString(),
      endDateTime: ticket.endDateTime?.toISOString() || null,
      requiresApproval: ticket.requiresApproval,
      price: ticket.price || null,
      quantity: ticket.quantity || null,
      status: ticket.status as TicketTemplateStatus,
      visibility: ticket.visibility as TicketTemplateVisibility,
      eventId: event1.id,
      currencyId: ticket.currencyId,
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

    const fakeInput = {
      name: faker.word.words(3),
    };

    const response = await executeGraphqlOperationAsUser<
      EditTicketMutation,
      EditTicketMutationVariables
    >(
      {
        document: EditTicket,
        variables: {
          input: {
            ticketId: ticket.id,
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
      description: ticket.description,
      startDateTime: ticket.startDateTime.toISOString(),
      endDateTime: ticket.endDateTime?.toISOString() || null,
      requiresApproval: ticket.requiresApproval,
      price: ticket.price,
      quantity: ticket.quantity,
      status: ticket.status as TicketTemplateStatus,
      visibility: ticket.visibility as TicketTemplateVisibility,
      eventId: event1.id,
      currencyId: ticket.currencyId,
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
          },
        },
      },
      user1,
    );

    assert.equal(response.errors?.[0].message, "Not authorized");
  });
});
