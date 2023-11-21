import { ensureKeys } from "../utils";
import { getSubscriptions } from "./api.mercadopago";
import { ENV } from "./types";

export const scheduled: ExportedHandlerScheduledHandler<ENV> = async (
  event,
  env,
  ctx,
) => {
  ensureKeys(env, [
    "DATABASE_URL",
    "DATABASE_TOKEN",
    "MP_ACCESS_TOKEN",
    "MP_PUBLIC_KEY",
  ]);
  await getSubscriptions(env);
};
