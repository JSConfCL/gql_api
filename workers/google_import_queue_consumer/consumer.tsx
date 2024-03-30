/* eslint-disable no-console */
import { H } from "@highlight-run/cloudflare";
import { v5 } from "uuid";

import { GoogleImportQueueElement } from "~/datasources/queues/google_import";
import { getSanityClient } from "~/datasources/sanity/client";
import { APP_ENV } from "~/env";
import { ensureKeys } from "~workers/utils";

type ENV = {
  SANITY_PROJECT_ID: string;
  HIGHLIGHT_PROJECT_ID: string;
  SANITY_DATASET: string;
  SANITY_API_VERSION: string;
  SANITY_SECRET_TOKEN: string;
};

export const queueConsumer: ExportedHandlerQueueHandler<
  ENV,
  GoogleImportQueueElement
> = async (batch, env, ctx) => {
  try {
    const r = new Request("cloudflare:workers:google_import_queue_consumer");
    H.init(r, { HIGHLIGHT_PROJECT_ID: env.HIGHLIGHT_PROJECT_ID ?? "" }, ctx);
    H.setAttributes({
      APP_ENV: APP_ENV ?? "none",
    });
    ensureKeys(env, [
      "SANITY_PROJECT_ID",
      "SANITY_DATASET",
      "SANITY_API_VERSION",
      "SANITY_SECRET_TOKEN",
      "HIGHLIGHT_PROJECT_ID",
    ]);
    const sanityClient = getSanityClient({
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
      apiVersion: env.SANITY_API_VERSION,
      token: env.SANITY_SECRET_TOKEN,
      useCdn: true,
    });
    console.log("Processing queue", batch.queue);
    for await (const msg of batch.messages) {
      try {
        console.log("Processing message", msg);
        const { googleMedia, sanityEventId } = msg.body;
        const event = await sanityClient.getDocument(sanityEventId);
        if (!event) {
          throw new Error(`Event ${sanityEventId} not found`);
        }
        const response = await fetch(googleMedia.baseUrl + "=w4096");
        const blob = await response.blob();

        const createdAsset = await sanityClient.assets.upload("image", blob, {
          contentType: googleMedia.mimeType,
          title: googleMedia.id,
          preserveFilename: true,
          creditLine: "JavaScript Chile",
          extract: ["blurhash", "exif", "image", "location", "lqip", "palette"],
        });
        console.log("Created asset", createdAsset, createdAsset.metadata);

        const createdImage = await sanityClient.createOrReplace({
          _id: v5(googleMedia.id, v5.URL),
          _type: "eventImage",
          externalId: googleMedia.id,
          externalURL: googleMedia.baseUrl,
          event: {
            _type: "reference",
            _ref: sanityEventId,
          },
          title: googleMedia.filename,
          image: {
            _type: "image",
            asset: {
              _type: "reference",
              _ref: createdAsset._id,
            },
          },
        });

        console.log("Created image", createdImage);

        msg.ack();
      } catch (e) {
        console.error(e);
        H.consumeError(e as Error);
        throw e;
      }
    }
  } catch (e) {
    console.error(e);
    H.consumeError(e as Error);
    throw e;
  }
};
