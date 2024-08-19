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
  insertUserData,
} from "~/tests/fixtures";

import {
  TriggerUserTicketApprovalReview,
  TriggerUserTicketApprovalReviewMutation,
  TriggerUserTicketApprovalReviewMutationVariables,
} from "./triggerUserTicketApprovalReview.generated";

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

  return { ticket: ticket1, user: user1, event: event1 };
};

describe("triggerUserTicketApprovalReview mutation", () => {
  describe("It should approve tickets", () => {
    it("If data is complete and ticket is Gifted", async () => {
      const { event, user } = await prepareTickets("gifted");

      await insertUserData({
        userId: user.id,
        rut: faker.random.alphaNumeric(10),
      });
      const response = await executeGraphqlOperationAsUser<
        TriggerUserTicketApprovalReviewMutation,
        TriggerUserTicketApprovalReviewMutationVariables
      >(
        {
          document: TriggerUserTicketApprovalReview,
          variables: {
            eventId: event.id,
            userId: user.id,
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.triggerUserTicketApprovalReview.length, 1);
    });
  });

  describe("It should not approve tickets", () => {
    it("If ticket is not pending", async () => {
      const { event, user } = await prepareTickets("cancelled");

      await insertUserData({
        userId: user.id,
        rut: faker.random.alphaNumeric(10),
      });
      const response = await executeGraphqlOperationAsUser<
        TriggerUserTicketApprovalReviewMutation,
        TriggerUserTicketApprovalReviewMutationVariables
      >(
        {
          document: TriggerUserTicketApprovalReview,
          variables: {
            eventId: event.id,
            userId: user.id,
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.triggerUserTicketApprovalReview.length, 0);
    });
  });
});
