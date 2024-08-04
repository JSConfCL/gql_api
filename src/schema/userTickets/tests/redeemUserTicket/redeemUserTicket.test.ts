import { it, describe, assert } from "vitest";

import { UserTicketsApprovalStatusEnum } from "~/datasources/db/userTickets";
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
  describe("Should work", () => {
    it("if user is admin of community", async () => {
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
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(
        response.data?.redeemUserTicket?.redemptionStatus,
        "redeemed",
      );
    });
    it("if user is collaborator of community", async () => {
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
        role: "collaborator",
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
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(
        response.data?.redeemUserTicket?.redemptionStatus,
        "redeemed",
      );
    });
    it("if user is super admin, and member of community", async () => {
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
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(
        response.data?.redeemUserTicket?.redemptionStatus,
        "redeemed",
      );
    });
    it("if user is event admin", async () => {
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
        role: "member",
      });
      await insertUserToEvent({
        eventId: event1.id,
        userId: user1.id,
        role: "admin",
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
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(
        response.data?.redeemUserTicket?.redemptionStatus,
        "redeemed",
      );
    });
    it("if user is event collaborator", async () => {
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
        role: "member",
      });
      await insertUserToEvent({
        eventId: event1.id,
        userId: user1.id,
        role: "collaborator",
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
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(
        response.data?.redeemUserTicket?.redemptionStatus,
        "redeemed",
      );
    });
  });
  describe("Should throw an error", () => {
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
    it("if ticket is already rejected", async () => {
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
      const purchaseOrder = await insertPurchaseOrder();
      const ticket1 = await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: UserTicketsApprovalStatusEnum.Rejected,
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
        user1,
      );

      assert.equal(
        response.errors?.[0].message,
        "No es posible redimir un ticket rechazado",
      );
    });
    it("if ticket is cancelled", async () => {
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
      const purchaseOrder = await insertPurchaseOrder();
      const ticket1 = await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: UserTicketsApprovalStatusEnum.Cancelled,
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
        user1,
      );

      assert.equal(
        response.errors?.[0].message,
        "No es posible redimir un ticket cancelado",
      );
    });
  });
});
