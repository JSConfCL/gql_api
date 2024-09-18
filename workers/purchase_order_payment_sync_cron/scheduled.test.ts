import { describe, expect, it, vi, beforeEach } from "vitest";

import { getDb } from "~/datasources/db";
import { getMercadoPagoPayment } from "~/datasources/mercadopago";
import { getStripePaymentStatus } from "~/datasources/stripe";
import {
  PurchaseOrderPaymentStatusEnum,
  PurchaseOrderStatusEnum,
} from "~/generated/types";
import { createLogger, Logger } from "~/logging";
import {
  insertPurchaseOrder,
  insertUser,
  insertAllowedCurrency,
  insertTicket,
  insertTicketTemplate,
  insertEvent,
  insertCommunity,
  insertEventToCommunity,
} from "~/tests/fixtures";
import { getTestDB } from "~/tests/fixtures/databaseHelper";

import { scheduled } from "./scheduled";

// Mock external dependencies
vi.mock("~/datasources/db");

type MercadoPagoModule = typeof import("~/datasources/mercadopago");

vi.mock(import("~/datasources/mercadopago"), async (importOriginal) => {
  const mod = await importOriginal<MercadoPagoModule>();

  return {
    ...mod,
    getMercadoPagoPayment: vi.fn(),
  };
});

type StripeModule = typeof import("~/datasources/stripe");

vi.mock(import("~/datasources/stripe"), async (importOriginal) => {
  const actual = await importOriginal<StripeModule>();

  return {
    ...actual,
    getStripePaymentStatus: vi.fn(),
  };
});

vi.mock("~/logging");

describe("Scheduled Cron Job for Purchase Order Payment Sync", () => {
  let testDB: Awaited<ReturnType<typeof getTestDB>>;
  let testUser: Awaited<ReturnType<typeof insertUser>>;
  let testCurrency: Awaited<ReturnType<typeof insertAllowedCurrency>>;
  let testCommunity: Awaited<ReturnType<typeof insertCommunity>>;
  let testEvent: Awaited<ReturnType<typeof insertEvent>>;
  let testTicketTemplate: Awaited<ReturnType<typeof insertTicketTemplate>>;

  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger;

  const mockEnv = {
    DB_URL: "test_db_url",
    STRIPE_KEY: "test_stripe_key",
    MERCADOPAGO_KEY: "test_mercadopago_key",
  } as const;

  beforeEach(async () => {
    vi.resetAllMocks();

    testDB = await getTestDB();

    testUser = await insertUser();

    testCurrency = await insertAllowedCurrency({ currency: "USD" });

    testCommunity = await insertCommunity({ name: "Test Community" });

    testEvent = await insertEvent({ name: "Test Event" });

    await insertEventToCommunity({
      communityId: testCommunity.id,
      eventId: testEvent.id,
    });

    testTicketTemplate = await insertTicketTemplate({
      name: "Test Ticket",
      eventId: testEvent.id,
    });

    vi.mocked(createLogger).mockReturnValue(mockLogger);

    vi.mocked(getDb).mockReturnValue(testDB);

    // Correctly mock getMercadoPagoPayment
    vi.mocked(getMercadoPagoPayment).mockResolvedValue({
      paymentStatus: PurchaseOrderPaymentStatusEnum.Paid,
      status: PurchaseOrderStatusEnum.Complete,
    });

    // Correctly mock getStripePaymentStatus
    vi.mocked(getStripePaymentStatus).mockResolvedValue({
      paymentStatus: PurchaseOrderPaymentStatusEnum.Paid,
      status: PurchaseOrderStatusEnum.Complete,
    });
  });

  it("should process unpaid purchase orders and clear expired ones", async () => {
    // Create test purchase orders
    const [unpaidStripeOrder, unpaidMercadoPagoOrder, expiredOrder] =
      await Promise.all([
        insertPurchaseOrder({
          userId: testUser.id,
          currencyId: testCurrency.id,
          status: PurchaseOrderStatusEnum.Open,
          purchaseOrderPaymentStatus: PurchaseOrderPaymentStatusEnum.Unpaid,
          paymentPlatform: "stripe",
          paymentPlatformReferenceID: "pi_mock_stripe",
        }),
        insertPurchaseOrder({
          userId: testUser.id,
          currencyId: testCurrency.id,
          status: PurchaseOrderStatusEnum.Open,
          purchaseOrderPaymentStatus: PurchaseOrderPaymentStatusEnum.Unpaid,
          paymentPlatform: "mercadopago",
          paymentPlatformReferenceID: "mp_mock_mercadopago",
        }),
        insertPurchaseOrder({
          userId: testUser.id,
          currencyId: testCurrency.id,
          status: PurchaseOrderStatusEnum.Open,
          purchaseOrderPaymentStatus: PurchaseOrderPaymentStatusEnum.Unpaid,
          paymentPlatformExpirationDate: new Date(
            Date.now() - 24 * 60 * 60 * 1000,
          ), // Yesterday
        }),
      ]);

    // Create associated tickets
    await Promise.all([
      insertTicket({
        userId: testUser.id,
        purchaseOrderId: unpaidStripeOrder.id,
        ticketTemplateId: testTicketTemplate.id,
      }),
      insertTicket({
        userId: testUser.id,
        purchaseOrderId: unpaidMercadoPagoOrder.id,
        ticketTemplateId: testTicketTemplate.id,
      }),
      insertTicket({
        userId: testUser.id,
        purchaseOrderId: expiredOrder.id,
        ticketTemplateId: testTicketTemplate.id,
      }),
    ]);

    // Execute scheduled cron job
    await scheduled(
      {
        cron: "1/1 * * * *",
        noRetry: () => {
          // Do nothing
        },
        scheduledTime: 1000,
      },
      mockEnv,
      {} as ExecutionContext,
    );

    // Verify purchase order status updates
    const [updatedStripeOrder, updatedMercadoPagoOrder, updatedExpiredOrder] =
      await Promise.all([
        testDB.query.purchaseOrdersSchema.findFirst({
          where: (po, { eq }) => eq(po.id, unpaidStripeOrder.id),
        }),
        testDB.query.purchaseOrdersSchema.findFirst({
          where: (po, { eq }) => eq(po.id, unpaidMercadoPagoOrder.id),
        }),
        testDB.query.purchaseOrdersSchema.findFirst({
          where: (po, { eq }) => eq(po.id, expiredOrder.id),
        }),
      ]);

    expect(updatedStripeOrder?.purchaseOrderPaymentStatus).toBe(
      PurchaseOrderPaymentStatusEnum.Paid,
    );

    expect(updatedStripeOrder?.status).toBe(PurchaseOrderStatusEnum.Complete);

    expect(updatedMercadoPagoOrder?.purchaseOrderPaymentStatus).toBe(
      PurchaseOrderPaymentStatusEnum.Paid,
    );

    expect(updatedMercadoPagoOrder?.status).toBe(
      PurchaseOrderStatusEnum.Complete,
    );

    expect(updatedExpiredOrder?.status).toBe(PurchaseOrderStatusEnum.Expired);

    // Verify ticket status updates
    const [
      updatedStripeTicket,
      updatedMercadoPagoTicket,
      updatedExpiredTicket,
    ] = await Promise.all([
      testDB.query.userTicketsSchema.findFirst({
        where: (ticket, { eq }) =>
          eq(ticket.purchaseOrderId, unpaidStripeOrder.id),
      }),
      testDB.query.userTicketsSchema.findFirst({
        where: (ticket, { eq }) =>
          eq(ticket.purchaseOrderId, unpaidMercadoPagoOrder.id),
      }),
      testDB.query.userTicketsSchema.findFirst({
        where: (ticket, { eq }) => eq(ticket.purchaseOrderId, expiredOrder.id),
      }),
    ]);

    expect(updatedStripeTicket?.approvalStatus).toBe("approved");

    expect(updatedMercadoPagoTicket?.approvalStatus).toBe("approved");

    expect(updatedExpiredTicket?.approvalStatus).toBe("cancelled");
  });
});
