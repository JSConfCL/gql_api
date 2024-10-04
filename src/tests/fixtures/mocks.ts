import { vitest } from "vitest";

import { Context } from "~/types";

type MockedService<T extends Record<string, unknown>> = Omit<
  T,
  | "fetch"
  | "__WORKER_ENTRYPOINT_BRAND"
  | "connect"
  | "logger"
  | "resend"
  | "tail"
  | "trace"
  | "scheduled"
  | "queue"
  | "test"
>;

export const MOCKED_RPC_SERVICE_EMAIL = {
  sendConfirmationYouAreOnTheWaitlist: vitest.fn(),
  sendPurchaseOrderSuccessful: vitest.fn(),
  sendConfirmationWaitlistAccepted: vitest.fn(),
  sendConfirmationWaitlistRejected: vitest.fn(),
  bulkSendEventTicketInvitations: vitest.fn(),
  bulkSendUserQRTicketEmail: vitest.fn(),
  sendTicketGiftAcceptedByReceiver: vitest.fn(),
  sendTicketGiftReceived: vitest.fn(),
  sendTicketGiftSent: vitest.fn(),
} satisfies MockedService<Context["RPC_SERVICE_EMAIL"]>;
