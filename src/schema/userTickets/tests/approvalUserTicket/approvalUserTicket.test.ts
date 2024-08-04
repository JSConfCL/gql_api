import { v4 } from "uuid";
import { it, describe, assert } from "vitest";

import { UserTicketsApprovalStatusEnum } from "~/datasources/db/userTickets";
import { TicketApprovalStatus } from "~/generated/types";
import {
  executeGraphqlOperationAsUser,
  insertEvent,
  insertPurchaseOrder,
  insertTicket,
  insertTicketTemplate,
  insertUser,
  insertUserToEvent,
} from "~/tests/fixtures";

import {
  ApprovalUserTicket,
  ApprovalUserTicketMutation,
  ApprovalUserTicketMutationVariables,
} from "./approvalUserTicket.generated";

describe("Approval user ticket", () => {
  it("Should approve a user ticket if is superadmin", async () => {
    const event1 = await insertEvent();
    const user1 = await insertUser({
      isSuperAdmin: true,
    });

    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "member",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
      requiresApproval: true,
    });
    const purchaseOrder = await insertPurchaseOrder();
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
    });
    const response = await executeGraphqlOperationAsUser<
      ApprovalUserTicketMutation,
      ApprovalUserTicketMutationVariables
    >(
      {
        document: ApprovalUserTicket,
        variables: {
          userTicketId: ticket1.id,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(
      response.data?.approvalUserTicket?.approvalStatus,
      TicketApprovalStatus.Approved,
    );
  });
  it("Should approve a user ticket if is event admin", async () => {
    const event1 = await insertEvent();
    const user1 = await insertUser();

    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
      requiresApproval: true,
    });
    const purchaseOrder = await insertPurchaseOrder();
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
    });
    const response = await executeGraphqlOperationAsUser<
      ApprovalUserTicketMutation,
      ApprovalUserTicketMutationVariables
    >(
      {
        document: ApprovalUserTicket,
        variables: {
          userTicketId: ticket1.id,
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(
      response.data?.approvalUserTicket?.approvalStatus,
      TicketApprovalStatus.Approved,
    );
  });
  it("It should throw an error if the user is not an event admin or superadmin", async () => {
    const event1 = await insertEvent();
    const user1 = await insertUser();

    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "member",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
      requiresApproval: true,
    });
    const purchaseOrder = await insertPurchaseOrder();
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
    });
    const response = await executeGraphqlOperationAsUser<
      ApprovalUserTicketMutation,
      ApprovalUserTicketMutationVariables
    >(
      {
        document: ApprovalUserTicket,
        variables: {
          userTicketId: ticket1.id,
        },
      },
      user1,
    );

    assert.equal(response.errors?.[0].message, "Unauthorized!");
  });
  it("It should throw an error if the ticket is already approved", async () => {
    const event1 = await insertEvent();
    const user1 = await insertUser({
      isSuperAdmin: true,
    });

    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "member",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
      requiresApproval: true,
    });
    const purchaseOrder = await insertPurchaseOrder();
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Approved,
      purchaseOrderId: purchaseOrder.id,
    });
    const response = await executeGraphqlOperationAsUser<
      ApprovalUserTicketMutation,
      ApprovalUserTicketMutationVariables
    >(
      {
        document: ApprovalUserTicket,
        variables: {
          userTicketId: ticket1.id,
        },
      },
      user1,
    );

    assert.equal(response.errors?.[0].message, "Ticket already approved");
  });
  it("It should throw an error if the ticket does not require approval", async () => {
    const event1 = await insertEvent();
    const user1 = await insertUser({
      isSuperAdmin: true,
    });

    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "member",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
      requiresApproval: false,
    });
    const purchaseOrder = await insertPurchaseOrder();
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
    });
    const response = await executeGraphqlOperationAsUser<
      ApprovalUserTicketMutation,
      ApprovalUserTicketMutationVariables
    >(
      {
        document: ApprovalUserTicket,
        variables: {
          userTicketId: ticket1.id,
        },
      },
      user1,
    );

    assert.equal(
      response.errors?.[0].message,
      "Ticket does not require approval",
    );
  });
  it("It should throw an error if the ticket is not found", async () => {
    const user1 = await insertUser({
      isSuperAdmin: true,
    });
    const response = await executeGraphqlOperationAsUser<
      ApprovalUserTicketMutation,
      ApprovalUserTicketMutationVariables
    >(
      {
        document: ApprovalUserTicket,
        variables: {
          userTicketId: v4(),
        },
      },
      user1,
    );

    assert.equal(response.errors?.[0].message, "Unauthorized!");
  });
});
