import { H } from "@highlight-run/cloudflare";

import { APP_ENV } from "~/env";

import { syncMercadopagoPaymentsAndSubscriptions } from "./api.mercadopago";
import { syncStripePayments } from "./api.stripe";
import { ENV } from "./types";
import { ensureKeys } from "../utils";

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
  H.init(
    new Request("about:blank"),
    {
      HIGHLIGHT_PROJECT_ID: env.HIGHLIGHT_PROJECT_ID ?? "",
    },
    ctx,
  );
  try {
    H.setAttributes({
      APP_ENV: APP_ENV ?? "none",
    });
    await Promise.all([
      syncMercadopagoPaymentsAndSubscriptions(env),
      syncStripePayments(env),
    ]);
  } catch (e) {
    H.consumeError(e as Error);
    console.error(e);
  }
};
