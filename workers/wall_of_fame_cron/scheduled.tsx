import { APP_ENV } from "~/env";
import { logger } from "~/logging";
import { ensureKeys } from "~workers/utils";

import { syncMercadopagoPaymentsAndSubscriptions } from "./api.mercadopago";
import { syncStripePayments } from "./api.stripe";
import { ENV } from "./types";

export const scheduled: ExportedHandlerScheduledHandler<ENV> = async (
  event,
  env,
  ctx,
) => {
  ensureKeys(env, [
    "NEON_URL",
    "MP_ACCESS_TOKEN",
    "MP_PUBLIC_KEY",
    "HIGHLIGHT_PROJECT_ID",
  ]);
  try {
    await Promise.all([
      syncMercadopagoPaymentsAndSubscriptions(env),
      syncStripePayments(env),
    ]);
  } catch (e) {
    logger.error(e);
  }
};
