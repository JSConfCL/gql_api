import Stripe from "stripe";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { Env } from "worker-configuration";
import { MercadoPagoFetch } from "~/datasources/mercadopago";
import {
  PurchaseOrderPaymentStatusEnum,
  PurchaseOrderStatusEnum,
} from "~/generated/types";
import {
  executeGraphqlOperationAsUser,
  insertPurchaseOrder,
  insertUser,
  insertAllowedCurrency,
  executeGraphqlOperation,
  insertTicket,
  insertTicketTemplate,
  insertEvent,
  insertCommunity,
  insertEventToCommunity,
} from "~/tests/fixtures";
import { getTestDB } from "~/tests/fixtures/databaseHelper";
import { Context } from "~/types";

import {
  CheckPurchaseOrderStatus,
  CheckPurchaseOrderStatusMutation,
  CheckPurchaseOrderStatusMutationVariables,
} from "./checkPurchaseOrderStatus.generated";

// Constants
const CURRENCY_USD = "USD";
const CURRENCY_ARS = "ARS";
const STRIPE_PAYMENT_PLATFORM = "stripe";
const MERCADOPAGO_PAYMENT_PLATFORM = "mercadopago";
const MOCK_PAYMENT_REFERENCE = "pi_123";
const MOCK_TOTAL_PRICE = "100";

// Types
type PaymentPlatform = "stripe" | "mercadopago";

interface TestData {
  user: Awaited<ReturnType<typeof insertUser>>;
  currency: { id: string; currency: string };
  community: { id: string };
  event: { id: string };
  ticketTemplate: { id: string };
}

// Helper functions
async function setupTestData(): Promise<TestData> {
  const user = await insertUser();
  const currency = await insertAllowedCurrency({ currency: CURRENCY_USD });
  const community = await insertCommunity({ name: "Test Community" });
  const event = await insertEvent({ name: "Test Event" });

  await insertEventToCommunity({
    communityId: community.id,
    eventId: event.id,
  });
  const ticketTemplate = await insertTicketTemplate({
    name: "Test Ticket",
    eventId: event.id,
  });

  return { user, currency, community, event, ticketTemplate };
}

async function createPurchaseOrder(
  userId: string,
  currencyId: string,
  paymentPlatform: PaymentPlatform,
  status: PurchaseOrderStatusEnum = PurchaseOrderStatusEnum.Open,
  paymentStatus: PurchaseOrderPaymentStatusEnum = PurchaseOrderPaymentStatusEnum.Unpaid,
) {
  return insertPurchaseOrder({
    userId,
    status,
    purchaseOrderPaymentStatus: paymentStatus,
    paymentPlatform,
    paymentPlatformReferenceID: MOCK_PAYMENT_REFERENCE,
    totalPrice: MOCK_TOTAL_PRICE,
    currencyId,
  });
}

function mockStripeClient(status: string, paymentStatus: string): Stripe {
  return {
    checkout: {
      sessions: {
        retrieve: vi
          .fn()
          .mockResolvedValue({ status, payment_status: paymentStatus }),
      },
    },
  } as unknown as Stripe;
}

function mockMercadoPagoFetch(
  status: string,
  currencyId: string,
  amount: number,
): MercadoPagoFetch {
  return vi.fn().mockResolvedValue({
    results: [
      {
        status,
        currency_id: currencyId,
        transaction_amount: amount,
      },
    ],
  });
}

async function executeCheckPurchaseOrderStatus(
  purchaseOrderId: string,
  user: Awaited<ReturnType<typeof insertUser>>,
  context: Partial<Context> = {},
) {
  return executeGraphqlOperationAsUser<
    CheckPurchaseOrderStatusMutation,
    CheckPurchaseOrderStatusMutationVariables
  >(
    {
      document: CheckPurchaseOrderStatus,
      variables: { input: { purchaseOrderId } },
    },
    user,
    context,
  );
}

describe("Check Purchase Order Status", () => {
  let testData: TestData;

  beforeEach(async () => {
    testData = await setupTestData();
  });

  describe("Stripe payments", () => {
    it("Should check the status of a Stripe purchase order successfully", async () => {
      const { user, currency, ticketTemplate } = testData;
      const purchaseOrder = await createPurchaseOrder(
        user.id,
        currency.id,
        STRIPE_PAYMENT_PLATFORM,
      );

      await insertTicket({
        userId: user.id,
        purchaseOrderId: purchaseOrder.id,
        ticketTemplateId: ticketTemplate.id,
      });

      const mockGetStripeClient = vi
        .fn()
        .mockReturnValue(mockStripeClient("complete", "paid"));

      const response = await executeCheckPurchaseOrderStatus(
        purchaseOrder.id,
        user,
        { GET_STRIPE_CLIENT: mockGetStripeClient },
      );

      expect(response.errors).toBeUndefined();
      const result = response.data?.checkPurchaseOrderStatus;

      expect(result).toBeDefined();

      expect(result?.id).toBe(purchaseOrder.id);

      expect(result?.status).toBe(PurchaseOrderStatusEnum.Complete);

      expect(result?.purchasePaymentStatus).toBe(
        PurchaseOrderPaymentStatusEnum.Paid,
      );

      expect(result?.paymentPlatform).toBe(STRIPE_PAYMENT_PLATFORM);

      expect(result?.finalPrice).toBe(100);

      expect(result?.currency?.currency).toBe(CURRENCY_USD);

      // Verify database update
      const testDB = await getTestDB();
      const updatedPurchaseOrder =
        await testDB.query.purchaseOrdersSchema.findFirst({
          where: (po, { eq }) => eq(po.id, purchaseOrder.id),
        });

      expect(updatedPurchaseOrder?.status).toBe(
        PurchaseOrderStatusEnum.Complete,
      );

      expect(updatedPurchaseOrder?.purchaseOrderPaymentStatus).toBe(
        PurchaseOrderPaymentStatusEnum.Paid,
      );
    });

    it("Should handle case when Stripe payment status doesn't change", async () => {
      const { user, currency } = testData;
      const purchaseOrder = await createPurchaseOrder(
        user.id,
        currency.id,
        STRIPE_PAYMENT_PLATFORM,
      );

      const mockGetStripeClient = vi
        .fn()
        .mockReturnValue(mockStripeClient("open", "unpaid"));

      const response = await executeCheckPurchaseOrderStatus(
        purchaseOrder.id,
        user,
        { GET_STRIPE_CLIENT: mockGetStripeClient },
      );

      expect(response.errors).toBeUndefined();
      const result = response.data?.checkPurchaseOrderStatus;

      expect(result?.status).toBe(PurchaseOrderStatusEnum.Open);

      expect(result?.purchasePaymentStatus).toBe(
        PurchaseOrderPaymentStatusEnum.Unpaid,
      );
    });
  });

  describe("MercadoPago payments", () => {
    it("Should handle MercadoPago payment platform", async () => {
      const { user, ticketTemplate } = testData;
      const currency = await insertAllowedCurrency({ currency: CURRENCY_ARS });
      const purchaseOrder = await createPurchaseOrder(
        user.id,
        currency.id,
        MERCADOPAGO_PAYMENT_PLATFORM,
      );

      await insertTicket({
        userId: user.id,
        purchaseOrderId: purchaseOrder.id,
        ticketTemplateId: ticketTemplate.id,
      });

      const mockMercadoPagoClient = mockMercadoPagoFetch(
        "approved",
        CURRENCY_ARS,
        1000,
      );

      const response = await executeCheckPurchaseOrderStatus(
        purchaseOrder.id,
        user,
        { GET_MERCADOPAGO_CLIENT: mockMercadoPagoClient },
      );

      expect(response.errors).toBeUndefined();
      const result = response.data?.checkPurchaseOrderStatus;

      expect(result?.paymentPlatform).toBe(MERCADOPAGO_PAYMENT_PLATFORM);

      expect(result?.status).toBe(PurchaseOrderStatusEnum.Complete);

      expect(result?.purchasePaymentStatus).toBe(
        PurchaseOrderPaymentStatusEnum.Paid,
      );

      expect(result?.currency?.currency).toBe(CURRENCY_ARS);
    });
  });

  describe("Authentication and authorization", () => {
    it("Should fail if user is not authenticated", async () => {
      const { user, currency } = testData;
      const purchaseOrder = await createPurchaseOrder(
        user.id,
        currency.id,
        STRIPE_PAYMENT_PLATFORM,
      );

      const response = await executeGraphqlOperation<
        CheckPurchaseOrderStatusMutation,
        CheckPurchaseOrderStatusMutationVariables
      >({
        document: CheckPurchaseOrderStatus,
        variables: { input: { purchaseOrderId: purchaseOrder.id } },
      });

      expect(response.errors).toBeDefined();

      expect(response.errors?.[0]?.message).toContain(
        "User is not authenticated",
      );
    });

    it("Should fail if user is not the owner of the purchase order", async () => {
      const { user, currency } = testData;
      const otherUser = await insertUser();
      const purchaseOrder = await createPurchaseOrder(
        otherUser.id,
        currency.id,
        STRIPE_PAYMENT_PLATFORM,
      );

      const response = await executeCheckPurchaseOrderStatus(
        purchaseOrder.id,
        user,
      );

      expect(response.errors).toBeDefined();
    });
  });

  describe("Email notifications", () => {
    it("Should send an email when payment status changes to paid", async () => {
      const { user, currency, ticketTemplate } = testData;
      const purchaseOrder = await createPurchaseOrder(
        user.id,
        currency.id,
        STRIPE_PAYMENT_PLATFORM,
      );

      await insertTicket({
        userId: user.id,
        purchaseOrderId: purchaseOrder.id,
        ticketTemplateId: ticketTemplate.id,
      });

      const mockGetStripeClient = vi
        .fn()
        .mockReturnValue(mockStripeClient("complete", "paid"));
      const mockSendPurchaseOrderSuccessful = vi.fn().mockResolvedValue(true);
      const mockRpcServiceEmail: Partial<Env["RPC_SERVICE_EMAIL"]> = {
        sendPurchaseOrderSuccessful: mockSendPurchaseOrderSuccessful,
      };

      await executeCheckPurchaseOrderStatus(purchaseOrder.id, user, {
        GET_STRIPE_CLIENT: mockGetStripeClient,
        RPC_SERVICE_EMAIL: mockRpcServiceEmail as Env["RPC_SERVICE_EMAIL"],
      });

      expect(mockSendPurchaseOrderSuccessful).toHaveBeenCalledTimes(1);
    });

    it("Should not send an email when payment status remains unpaid", async () => {
      const { user, currency, ticketTemplate } = testData;
      const purchaseOrder = await createPurchaseOrder(
        user.id,
        currency.id,
        STRIPE_PAYMENT_PLATFORM,
      );

      await insertTicket({
        userId: user.id,
        purchaseOrderId: purchaseOrder.id,
        ticketTemplateId: ticketTemplate.id,
      });

      const mockGetStripeClient = vi
        .fn()
        .mockReturnValue(mockStripeClient("open", "unpaid"));
      const mockSendPurchaseOrderSuccessful = vi.fn().mockResolvedValue(true);
      const mockRpcServiceEmail: Partial<Env["RPC_SERVICE_EMAIL"]> = {
        sendPurchaseOrderSuccessful: mockSendPurchaseOrderSuccessful,
      };

      await executeCheckPurchaseOrderStatus(purchaseOrder.id, user, {
        GET_STRIPE_CLIENT: mockGetStripeClient,
        RPC_SERVICE_EMAIL: mockRpcServiceEmail as Env["RPC_SERVICE_EMAIL"],
      });

      expect(mockSendPurchaseOrderSuccessful).not.toHaveBeenCalled();
    });
  });
});
