import { ensureKeys } from "../utils";
import { getSubscriptions } from "./api.mercadopago";
import { ENV } from "./types";

export const scheduled: ExportedHandlerScheduledHandler<ENV> = async (
  event,
  env,
  ctx,
) => {
  ensureKeys(env, ["NEON_URL", "MP_ACCESS_TOKEN", "MP_PUBLIC_KEY"]);
  try {
    await getSubscriptions(env);
  } catch (e) {
    console.error(e);
  }
};
