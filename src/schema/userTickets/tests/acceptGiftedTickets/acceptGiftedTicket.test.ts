import { it, describe, assert } from "vitest";

import {
  UserTicketGiftStatus,
  userTicketsApprovalStatusEnum,
} from "~/datasources/db/userTickets";
import {
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertPurchaseOrder,
  insertTicket,
  insertTicketTemplate,
  insertUser,
  insertUserTicketGift,
} from "~/tests/fixtures";

import {
  AcceptGiftedTicket,
  AcceptGiftedTicketMutation,
  AcceptGiftedTicketMutationVariables,
} from "./acceptGiftedTicket.generated";
import { getExpirationDateForGift } from "../../helpers";

const prepareTickets = async (
  status: (typeof userTicketsApprovalStatusEnum)[number] = "gifted",
) => {
  const community1 = await insertCommunity();
  const event1 = await insertEvent();

  await insertEventToCommunity({
    eventId: event1.id,
    communityId: community1.id,
  });
  const gifterUser = await insertUser();
  const recipientUser = await insertUser();
  const ticketTemplate1 = await insertTicketTemplate({
    eventId: event1.id,
  });
  const purchaseOrder = await insertPurchaseOrder();
  const ticket1 = await insertTicket({
    ticketTemplateId: ticketTemplate1.id,
    userId: gifterUser.id,
    purchaseOrderId: purchaseOrder.id,
    approvalStatus: status,
  });
  const ticketGift1 = await insertUserTicketGift({
    userTicketId: ticket1.id,
    gifterUserId: gifterUser.id,
    recipientUserId: recipientUser.id,
    status:
      status === "gifted"
        ? UserTicketGiftStatus.Pending
        : UserTicketGiftStatus.Accepted,
    expirationDate: getExpirationDateForGift(),
  });

  return {
    ticket: ticket1,
    gifterUser,
    recipientUser,
    ticketGift: ticketGift1,
  };
};

describe("Accept user ticket gift", () => {
  describe("Should work", () => {
    it("If ticket is in a gifted status and user is ticket owner", async () => {
      const { recipientUser, ticketGift } = await prepareTickets();
      const response = await executeGraphqlOperationAsUser<
        AcceptGiftedTicketMutation,
        AcceptGiftedTicketMutationVariables
      >(
        {
          document: AcceptGiftedTicket,
          variables: {
            giftId: ticketGift.id,
          },
        },
        recipientUser,
      );

      assert.equal(response.errors, undefined);

      assert.equal(
        response.data?.acceptGiftedTicket?.approvalStatus,
        "gift_accepted",
      );
    });
  });

  describe("Should throw an error", () => {
    it("if user is not owner", async () => {
      const { ticketGift } = await prepareTickets();
      const otherUser = await insertUser();
      const response = await executeGraphqlOperationAsUser<
        AcceptGiftedTicketMutation,
        AcceptGiftedTicketMutationVariables
      >(
        {
          document: AcceptGiftedTicket,
          variables: {
            giftId: ticketGift.id,
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
        AcceptGiftedTicketMutation,
        AcceptGiftedTicketMutationVariables
      >(
        {
          document: AcceptGiftedTicket,
          variables: {
            giftId: "non-existent-id",
          },
        },
        recipientUser,
      );

      assert.equal(response.errors?.[0].message, "Unexpected error.");
    });

    it("If tickets is not in a gifted state", async () => {
      const { recipientUser, ticketGift } =
        await prepareTickets("gift_accepted");
      const response = await executeGraphqlOperationAsUser<
        AcceptGiftedTicketMutation,
        AcceptGiftedTicketMutationVariables
      >(
        {
          document: AcceptGiftedTicket,
          variables: {
            giftId: ticketGift.id,
          },
        },
        recipientUser,
      );

      assert.equal(
        response.errors?.[0].message,
        "Ticket is not a gifted ticket",
      );
    });
  });
});
