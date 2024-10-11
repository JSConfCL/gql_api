import { it, describe, assert } from "vitest";

import { userTicketsApprovalStatusEnum } from "~/datasources/db/userTickets";
import { UserTicketTransferStatus } from "~/datasources/db/userTicketsTransfers";
import {
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertPurchaseOrder,
  insertTicket,
  insertTicketTemplate,
  insertUser,
  insertUserTicketTransfer,
} from "~/tests/fixtures";

import {
  AcceptTransferredTicket,
  AcceptTransferredTicketMutation,
  AcceptTransferredTicketMutationVariables,
} from "./acceptTransferredTicket.generated";
import { getExpirationDateForTicketTransfer } from "../../helpers";

const prepareTickets = async (
  status: (typeof userTicketsApprovalStatusEnum)[number] = "gifted",
) => {
  const community1 = await insertCommunity();
  const event1 = await insertEvent();

  await insertEventToCommunity({
    eventId: event1.id,
    communityId: community1.id,
  });
  const senderUser = await insertUser();
  const recipientUser = await insertUser();
  const ticketTemplate1 = await insertTicketTemplate({
    eventId: event1.id,
  });
  const purchaseOrder = await insertPurchaseOrder();
  const ticket1 = await insertTicket({
    ticketTemplateId: ticketTemplate1.id,
    userId: senderUser.id,
    purchaseOrderId: purchaseOrder.id,
    approvalStatus: status,
  });
  const ticketTransfer1 = await insertUserTicketTransfer({
    userTicketId: ticket1.id,
    senderUserId: senderUser.id,
    recipientUserId: recipientUser.id,
    status:
      status === "gifted"
        ? UserTicketTransferStatus.Pending
        : UserTicketTransferStatus.Accepted,
    expirationDate: getExpirationDateForTicketTransfer(),
  });

  return {
    ticket: ticket1,
    senderUser,
    recipientUser,
    ticketTransfer: ticketTransfer1,
  };
};

describe("Accept user ticket transfer", () => {
  describe("Should work", () => {
    it("If ticket is in a transferable status and user is ticket owner", async () => {
      const { recipientUser, ticketTransfer } = await prepareTickets();
      const response = await executeGraphqlOperationAsUser<
        AcceptTransferredTicketMutation,
        AcceptTransferredTicketMutationVariables
      >(
        {
          document: AcceptTransferredTicket,
          variables: {
            transferId: ticketTransfer.id,
          },
        },
        recipientUser,
      );

      assert.equal(response.errors, undefined);

      assert.equal(
        response.data?.acceptTransferredTicket?.approvalStatus,
        "gift_accepted",
      );
    });
  });

  describe("Should throw an error", () => {
    it("if user is not owner", async () => {
      const { ticketTransfer } = await prepareTickets();
      const otherUser = await insertUser();
      const response = await executeGraphqlOperationAsUser<
        AcceptTransferredTicketMutation,
        AcceptTransferredTicketMutationVariables
      >(
        {
          document: AcceptTransferredTicket,
          variables: {
            transferId: ticketTransfer.id,
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
      const { recipientUser } = await prepareTickets();
      const response = await executeGraphqlOperationAsUser<
        AcceptTransferredTicketMutation,
        AcceptTransferredTicketMutationVariables
      >(
        {
          document: AcceptTransferredTicket,
          variables: {
            transferId: "non-existent-id",
          },
        },
        recipientUser,
      );

      assert.equal(response.errors?.[0].message, "Unexpected error.");
    });

    it("If tickets is not in a transferable state", async () => {
      const { recipientUser, ticketTransfer } =
        await prepareTickets("gift_accepted");
      const response = await executeGraphqlOperationAsUser<
        AcceptTransferredTicketMutation,
        AcceptTransferredTicketMutationVariables
      >(
        {
          document: AcceptTransferredTicket,
          variables: {
            transferId: ticketTransfer.id,
          },
        },
        recipientUser,
      );

      assert.equal(response.errors?.[0].message, "Ticket is not transferable");
    });
  });
});
