import { H } from "@highlight-run/cloudflare";

import { APP_ENV } from "~/env";
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
    await Promise.all([importFromSanity(env)]);
  } catch (e) {
    H.consumeError(e as Error);
    console.error(e);
  }
};
