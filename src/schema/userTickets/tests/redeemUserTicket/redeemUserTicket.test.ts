import { it, describe, assert } from "vitest";

import { UserTicketApprovalStatus } from "~/datasources/db/userTickets";
import {
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertPurchaseOrder,
  insertTicket,
  insertTicketTemplate,
  insertUser,
  insertUserToCommunity,
  insertUserToEvent,
} from "~/tests/fixtures";

import {
  RedeemUserTicket,
  RedeemUserTicketMutation,
  RedeemUserTicketMutationVariables,
} from "./redeemUserTicket.generated";

describe("Redeem user ticket", () => {
  // Helper function to set up the test environment
  const setupRedeemTicketTest = async (userRole: {
    communityRole?: "admin" | "collaborator" | "member";
    eventRole?: "admin" | "collaborator" | "member";
    isSuperAdmin?: boolean;
  }) => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });

    const user1 = await insertUser({
      isSuperAdmin: userRole.isSuperAdmin,
    });

    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: userRole.communityRole ?? "member",
    });

    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: userRole.eventRole ?? "member",
    });

    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const purchaseOrder = await insertPurchaseOrder();

    return {
      user1,
      ticketTemplate1,
      purchaseOrder,
    };
  };

  // Helper function to test ticket redemption
  const testTicketRedemption = async (
    setup: Awaited<ReturnType<typeof setupRedeemTicketTest>>,
    approvalStatus: UserTicketApprovalStatus,
    expectedError?: string,
  ) => {
    const ticket1 = await insertTicket({
      ticketTemplateId: setup.ticketTemplate1.id,
      userId: setup.user1.id,
      purchaseOrderId: setup.purchaseOrder.id,
      approvalStatus,
    });

    const response = await executeGraphqlOperationAsUser<
      RedeemUserTicketMutation,
      RedeemUserTicketMutationVariables
    >(
      {
        document: RedeemUserTicket,
        variables: {
          userTicketId: ticket1.id,
        },
      },
      setup.user1,
    );

    if (expectedError) {
      assert.equal(response.errors?.[0].message, expectedError);
    } else {
      assert.equal(response.errors, undefined);

      assert.equal(
        response.data?.redeemUserTicket?.redemptionStatus,
        "redeemed",
      );
    }
  };

  describe("Should work", () => {
    it("if user is admin of community", async () => {
      const setup = await setupRedeemTicketTest({
        communityRole: "admin",
        eventRole: "admin",
      });

      await testTicketRedemption(setup, "approved");
    });

    it("if user is collaborator of community", async () => {
      const setup = await setupRedeemTicketTest({
        communityRole: "collaborator",
        eventRole: "member",
      });

      await testTicketRedemption(setup, "approved");
    });

    it("if user is super admin, and member of community", async () => {
      const setup = await setupRedeemTicketTest({
        communityRole: "member",
        eventRole: "member",
        isSuperAdmin: true,
      });

      await testTicketRedemption(setup, "approved");
    });

    it("if user is event admin", async () => {
      const setup = await setupRedeemTicketTest({
        communityRole: "member",
        eventRole: "admin",
      });

      await testTicketRedemption(setup, "approved");
    });

    it("if user is event collaborator", async () => {
      const setup = await setupRedeemTicketTest({
        communityRole: "member",
        eventRole: "collaborator",
      });

      await testTicketRedemption(setup, "approved");
    });
  });

  describe("Should throw an error", () => {
    const NON_REDEEMABLE_STATUSES = [
      "pending",
      "rejected",
      "cancelled",
      "transfer_pending",
      "gifted",
    ] as UserTicketApprovalStatus[];

    NON_REDEEMABLE_STATUSES.forEach((status) => {
      it(`if ticket is ${status}`, async () => {
        const setup = await setupRedeemTicketTest({
          communityRole: "admin",
          eventRole: "admin",
        });

        await testTicketRedemption(
          setup,
          status,
          "The ticket is not redeemable",
        );
      });
    });

    it("if is not authorized", async () => {
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
      const purchaseOrder = await insertPurchaseOrder();
      const ticket1 = await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
      });

      const response = await executeGraphqlOperationAsUser<
        RedeemUserTicketMutation,
        RedeemUserTicketMutationVariables
      >(
        {
          document: RedeemUserTicket,
          variables: {
            userTicketId: ticket1.id,
          },
        },
        user2,
      );

      assert.equal(
        response.errors?.[0].message,
        "No tienes permisos para redimir este ticket",
      );
    });
  });
});
