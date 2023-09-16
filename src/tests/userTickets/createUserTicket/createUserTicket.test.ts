import { it, describe, afterEach, assert } from "vitest";
import {
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertTicket,
  insertTicketTemplate,
  insertUser,
  insertUserToCommunity,
  insertUserToEvent,
} from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  CreateUserTicket,
  CreateUserTicketMutation,
  CreateUserTicketMutationVariables,
} from "./createUserTicket.generated";

afterEach(() => {
  clearDatabase();
});

describe.only("User", () => {
  it("It should throw a error, if event is not active", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent({
      status: "inactive",
    });
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const response = await executeGraphqlOperationAsUser<
      CreateUserTicketMutation,
      CreateUserTicketMutationVariables
    >(
      {
        document: CreateUserTicket,
        variables: {
          ticketId: ticketTemplate1.id,
        },
      },
      user1,
    );
    assert.equal(response.errors?.[0].message, "Unauthorized!");
  });
  it("It should throw a error, if ticket is not active", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent({
      status: "active",
    });
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
      status: "inactive",
    });
    const response = await executeGraphqlOperationAsUser<
      CreateUserTicketMutation,
      CreateUserTicketMutationVariables
    >(
      {
        document: CreateUserTicket,
        variables: {
          ticketId: ticketTemplate1.id,
        },
      },
      user1,
    );
    assert.equal(response.errors?.[0].message, "Unauthorized!");
  });
  it("It should throw a error, if user is not a member of the event", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent({
      status: "active",
    });
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const response = await executeGraphqlOperationAsUser<
      CreateUserTicketMutation,
      CreateUserTicketMutationVariables
    >(
      {
        document: CreateUserTicket,
        variables: {
          ticketId: ticketTemplate1.id,
        },
      },
      user1,
    );
    assert.equal(response.errors?.[0].message, "Unauthorized!");
  });
  it("It should throw a error, if event has ended", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent({
      status: "active",
      startDateTime: new Date("2021-01-01"),
      endDateTime: new Date("2021-01-02"),
      maxAttendees: 1,
    });
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
      status: "active",
    });
    const response = await executeGraphqlOperationAsUser<
      CreateUserTicketMutation,
      CreateUserTicketMutationVariables
    >(
      {
        document: CreateUserTicket,
        variables: {
          ticketId: ticketTemplate1.id,
        },
      },
      user1,
    );
    assert.equal(response.errors?.[0].message, "Event has ended");
  });
  it("It should throw a error, if ticket is sold out", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent({
      status: "active",
      startDateTime: new Date("2021-01-01"),
      endDateTime: new Date("2025-01-02"),
      maxAttendees: 1,
    });
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
      status: "active",
      quantity: 1,
    });
    await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      status: "active",
      approvalStatus: "approved",
      userId: user1.id,
    });
    const response = await executeGraphqlOperationAsUser<
      CreateUserTicketMutation,
      CreateUserTicketMutationVariables
    >(
      {
        document: CreateUserTicket,
        variables: {
          ticketId: ticketTemplate1.id,
        },
      },
      user1,
    );
    assert.equal(response.errors?.[0].message, "Ticket sold out");
  });
  it("It should create a user ticket", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent({
      status: "active",
      startDateTime: new Date("2021-01-01"),
      endDateTime: new Date("2025-01-02"),
      maxAttendees: 1,
    });
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
      status: "active",
      quantity: 5,
    });
    const response = await executeGraphqlOperationAsUser<
      CreateUserTicketMutation,
      CreateUserTicketMutationVariables
    >(
      {
        document: CreateUserTicket,
        variables: {
          ticketId: ticketTemplate1.id,
        },
      },
      user1,
    );
    assert.equal(response.errors, undefined);
    assert.exists(response.data?.createUserTicket);
  });
});
