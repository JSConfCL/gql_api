import { APP_ENV } from "~/env";
import { logger } from "~/logging";
import { ensureKeys } from "~workers/utils";

import { importFromSanity } from "./importSanity";
import { ENV } from "./types";

export const scheduled: ExportedHandlerScheduledHandler<ENV> = async (
  event,
  env,
  ctx,
) => {
  ensureKeys(env, [
    "SANITY_PROJECT_ID",
    "NEON_URL",
    "HIGHLIGHT_PROJECT_ID",
    "SANITY_DATASET",
    "SANITY_API_VERSION",
    "SANITY_SECRET_TOKEN",
  ]);
  try {
    await Promise.all([importFromSanity(env)]);
  } catch (e) {
    logger.error(e);
  }
};
