import { vitest } from "vitest";

import { Context } from "~/types";

type MockedService<T extends Record<string, any>> = Omit<
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
  sendEventTicketInvitationsBatch: vitest.fn(),
} satisfies MockedService<Context["RPC_SERVICE_EMAIL"]>;
