import { assert, describe, it } from "vitest";

import { userTicketFetcher } from "~/schema/userTickets/userTicketFetcher";
import {
  insertEvent,
  insertPurchaseOrder,
  insertTicket,
  insertTicketTemplate,
  insertUser,
} from "~/tests/fixtures";
import { getTestDB } from "~/tests/fixtures/databaseHelper";

const setupTest = async () => {
  const testDB = await getTestDB();
  const event1 = await insertEvent();
  const user1 = await insertUser();
  const ticketTemplate1 = await insertTicketTemplate({
    eventId: event1.id,
  });
  const purchaseOrder = await insertPurchaseOrder({
    purchaseOrderPaymentStatus: "paid",
  });

  return {
    testDB,
    event1,
    user1,
    ticketTemplate1,
    purchaseOrder,
  };
};

describe("Search for user tickets", () => {
  describe("Should work", () => {
    it("Should filter by ticket id", async () => {
      const { testDB, user1, ticketTemplate1, purchaseOrder } =
        await setupTest();
      const ticket1 = await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date("2021-01-01"),
        redemptionStatus: "redeemed",
      });
      const response = await userTicketFetcher.searchUserTickets({
        DB: testDB,
        search: {
          userTicketIds: [ticket1.id],
        },
      });

      assert.equal(response.length, 1);
    });
    it("Should filter by userId", async () => {
      const { testDB, user1, ticketTemplate1, purchaseOrder } =
        await setupTest();
      const user2 = await insertUser();
      const ticket1 = await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date("2022-01-01"),
        redemptionStatus: "redeemed",
      });

      await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user2.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date(),
        redemptionStatus: "redeemed",
      });
      const response = await userTicketFetcher.searchUserTickets({
        DB: testDB,
        search: {
          userIds: [user1.id],
        },
      });

      assert.equal(response.length, 1);
      assert.equal(response[0].id, ticket1.id);
    });
    it("Should filter by eventId", async () => {
      const { testDB, user1, ticketTemplate1, event1, purchaseOrder } =
        await setupTest();
      const event2 = await insertEvent();
      const ticketTemplate2 = await insertTicketTemplate({
        eventId: event2.id,
      });
      const ticket1 = await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date("2021-01-01"),
        redemptionStatus: "redeemed",
      });

      await insertTicket({
        ticketTemplateId: ticketTemplate2.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date("2022-01-01"),
        redemptionStatus: "redeemed",
      });
      const response = await userTicketFetcher.searchUserTickets({
        DB: testDB,
        search: {
          eventIds: [event1.id],
        },
      });

      assert.equal(response.length, 1);
      assert.equal(response[0].id, ticket1.id);
    });
    it("Should filter by paymentStatus", async () => {
      const { testDB, user1, ticketTemplate1, purchaseOrder } =
        await setupTest();
      const ticket1 = await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date("2021-01-01"),
        redemptionStatus: "redeemed",
      });

      const ticket2 = await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date("2022-01-01"),
        redemptionStatus: "redeemed",
      });
      const response = await userTicketFetcher.searchUserTickets({
        DB: testDB,
        search: {
          paymentStatus: ["paid"],
        },
      });

      assert.equal(response.length, 2);
      assert.equal(response[0].id, ticket2.id);
      assert.equal(response[1].id, ticket1.id);
    });
    it("Should filter by approvalStatus", async () => {
      const { testDB, user1, ticketTemplate1, purchaseOrder } =
        await setupTest();
      const ticket1 = await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date("2021-01-01"),
        redemptionStatus: "redeemed",
      });

      await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "pending",
        createdAt: new Date("2022-01-01"),
        redemptionStatus: "redeemed",
      });
      const response = await userTicketFetcher.searchUserTickets({
        DB: testDB,
        search: {
          approvalStatus: ["approved"],
        },
      });

      assert.equal(response.length, 1);
      assert.equal(response[0].id, ticket1.id);
    });
    it("Should filter by redemptionStatus", async () => {
      const { testDB, user1, ticketTemplate1, purchaseOrder } =
        await setupTest();
      const ticket1 = await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date("2021-01-01"),
        redemptionStatus: "redeemed",
      });

      await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date("2022-01-01"),
        redemptionStatus: "pending",
      });
      const response = await userTicketFetcher.searchUserTickets({
        DB: testDB,
        search: {
          redemptionStatus: ["redeemed"],
        },
      });

      assert.equal(response.length, 1);
      assert.equal(response[0].id, ticket1.id);
    });
    it("Should filter by multiple fields", async () => {
      const { testDB, user1, ticketTemplate1, purchaseOrder } =
        await setupTest();
      const ticket1 = await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date("2021-01-01"),
        redemptionStatus: "redeemed",
      });

      await insertTicket({
        ticketTemplateId: ticketTemplate1.id,
        userId: user1.id,
        purchaseOrderId: purchaseOrder.id,
        approvalStatus: "approved",
        createdAt: new Date("2022-01-01"),
        redemptionStatus: "pending",
      });
      const response = await userTicketFetcher.searchUserTickets({
        DB: testDB,
        search: {
          paymentStatus: ["paid"],
          approvalStatus: ["approved"],
          redemptionStatus: ["redeemed"],
        },
      });

      assert.equal(response.length, 1);
      assert.equal(response[0].id, ticket1.id);
    });
  });
});
