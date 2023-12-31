import { it, describe, assert } from "vitest";
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
import {
  CancelUserTicket,
  CancelUserTicketMutation,
  CancelUserTicketMutationVariables,
} from "./cancelUserTicket.generated";
import { TicketStatus } from "../../../generated/types";

describe("Cancel User Ticket", () => {
  it("Should cancel a user ticket if user is the owner of the ticket", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
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
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      status: "active",
    });
    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketMutation,
      CancelUserTicketMutationVariables
    >(
      {
        document: CancelUserTicket,
        variables: {
          userTicketId: ticket1.id,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(
      response.data?.cancelUserTicket?.status,
      TicketStatus.Inactive,
    );
  });
  it("Should cancel a user ticket with role superadmin", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser({
      isSuperAdmin: true,
    });
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "member",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "member",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      status: "active",
    });
    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketMutation,
      CancelUserTicketMutationVariables
    >(
      {
        document: CancelUserTicket,
        variables: {
          userTicketId: ticket1.id,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(
      response.data?.cancelUserTicket?.status,
      TicketStatus.Inactive,
    );
  });
  it("It should throw an error, if ticket does not exist", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
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
    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketMutation,
      CancelUserTicketMutationVariables
    >(
      {
        document: CancelUserTicket,
        variables: {
          userTicketId: "2",
        },
      },
      user1,
    );
    assert.equal(response.errors?.[0].message, "You can't cancel this ticket");
  });
  it("It should throw a error, if is not authorized", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();
    const user2 = await insertUser();
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "member",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "member",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      status: "active",
    });
    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketMutation,
      CancelUserTicketMutationVariables
    >(
      {
        document: CancelUserTicket,
        variables: {
          userTicketId: ticket1.id,
        },
      },
      user2,
    );
    assert.deepInclude(
      response.errors?.[0].message,
      "You can't cancel this ticket",
    );
  });
});
