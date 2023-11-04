import { ensureKeys } from "../utils";
import { getSubscriptions } from "./api.stripe";
import { ENV } from "./types";

export const scheduled: ExportedHandlerScheduledHandler<ENV> = async (
  event,
  env,
  ctx,
) => {
  ensureKeys(env);
  await getSubscriptions(env);
};
