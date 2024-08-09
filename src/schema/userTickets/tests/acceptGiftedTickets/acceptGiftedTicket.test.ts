import { faker } from "@faker-js/faker";
import { it, describe, assert } from "vitest";

import { userTicketsApprovalStatusEnum } from "~/datasources/db/userTickets";
import {
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertPurchaseOrder,
  insertTicket,
  insertTicketTemplate,
  insertUser,
} from "~/tests/fixtures";

import {
  AcceptGiftedTicket,
  AcceptGiftedTicketMutation,
  AcceptGiftedTicketMutationVariables,
} from "./acceptGiftedTicket.generated";

const prepareTickets = async (
  status: (typeof userTicketsApprovalStatusEnum)[number] = "gifted",
) => {
  const community1 = await insertCommunity();
  const event1 = await insertEvent();

  await insertEventToCommunity({
    eventId: event1.id,
    communityId: community1.id,
  });
  const user1 = await insertUser();
  const ticketTemplate1 = await insertTicketTemplate({
    eventId: event1.id,
  });
  const purchaseOrder = await insertPurchaseOrder();
  const ticket1 = await insertTicket({
    ticketTemplateId: ticketTemplate1.id,
    userId: user1.id,
    purchaseOrderId: purchaseOrder.id,
    approvalStatus: status,
  });

  return { ticket: ticket1, user: user1 };
};

describe("Redeem user ticket", () => {
  describe("Should work", () => {
    it("If ticket is in a gifted status and user is ticket owner", async () => {
      const { ticket, user } = await prepareTickets();
      const response = await executeGraphqlOperationAsUser<
        AcceptGiftedTicketMutation,
        AcceptGiftedTicketMutationVariables
      >(
        {
          document: AcceptGiftedTicket,
          variables: {
            userTicketId: ticket.id,
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(
        response.data?.acceptGiftedTicket?.approvalStatus,
        "approved",
      );
    });
  });

  describe("Should throw an error", () => {
    it("if user is not owner", async () => {
      const { ticket } = await prepareTickets();
      const otherUser = await insertUser();
      const response = await executeGraphqlOperationAsUser<
        AcceptGiftedTicketMutation,
        AcceptGiftedTicketMutationVariables
      >(
        {
          document: AcceptGiftedTicket,
          variables: {
            userTicketId: ticket.id,
          },
        },
        otherUser,
      );

      assert.equal(
        response.errors?.[0].message,
        "Could not find ticket to accept",
      );
    });

    it("if ticket does not exist", async () => {
      const { user } = await prepareTickets();
      const response = await executeGraphqlOperationAsUser<
        AcceptGiftedTicketMutation,
        AcceptGiftedTicketMutationVariables
      >(
        {
          document: AcceptGiftedTicket,
          variables: {
            userTicketId: faker.string.uuid(),
          },
        },
        user,
      );

      assert.equal(
        response.errors?.[0].message,
        "Could not find ticket to accept",
      );
    });

    it("If tickets is not in a gifted state", async () => {
      const { ticket, user } = await prepareTickets("gift_accepted");
      const response = await executeGraphqlOperationAsUser<
        AcceptGiftedTicketMutation,
        AcceptGiftedTicketMutationVariables
      >(
        {
          document: AcceptGiftedTicket,
          variables: {
            userTicketId: ticket.id,
          },
        },
        user,
      );

      assert.equal(
        response.errors?.[0].message,
        "Ticket is not a gifted ticket",
      );
    });
  });
});
