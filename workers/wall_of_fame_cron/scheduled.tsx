import { getSubscriptions } from "./api.stripe";
import { ENV } from "./types";

const ensureKeys = (env: ENV) => {
  const keys = [
    "DATABASE_URL",
    "DATABASE_TOKEN",
    "MP_ACCESS_TOKEN",
    "MP_PUBLIC_KEY",
    "RV_KEY",
    "ST_KEY",
  ] as const;
  for (const key of keys) {
    if (!env[key]) {
      throw new Error(`${key} is not defined`);
    }
  }
  return env;
};

export const scheduled: ExportedHandlerScheduledHandler<ENV> = async (
  event,
  env,
  ctx,
) => {
  ensureKeys(env);
  await getSubscriptions(env);
};
