/* eslint-disable no-console */
import { createClient } from "@sanity/client";
import { ensureKeys } from "../utils";
import { GoogleImportQueueElement } from "../../src/datasources/queues/google_import";
import { v5 } from "uuid";

type ENV = {
  SANITY_PROJECT_ID: string;
  SANITY_DATASET: string;
  SANITY_API_VERSION: string;
  SANITY_SECRET_TOKEN: string;
};

const getSanityClient = (env: ENV) =>
  createClient({
    projectId: env.SANITY_PROJECT_ID,
    dataset: env.SANITY_DATASET,
    useCdn: false,
    apiVersion: env.SANITY_API_VERSION, // use current date (YYYY-MM-DD) to target the latest API version
    token: env.SANITY_SECRET_TOKEN, // Only if you want to update content with the client
  });

export const queueConsumer: ExportedHandlerQueueHandler<
  ENV,
  GoogleImportQueueElement
> = async (batch, env) => {
  ensureKeys(env, [
    "SANITY_PROJECT_ID",
    "SANITY_DATASET",
    "SANITY_API_VERSION",
    "SANITY_SECRET_TOKEN",
  ]);
  const sanityClient = getSanityClient(env);
  console.log("Processing queue", batch.queue);
  for await (const msg of batch.messages) {
    console.log("Processing message", msg);
    const { googleMedia, sanityEventInstanceId } = msg.body;
    const eventInstance = await sanityClient.getDocument(sanityEventInstanceId);
    if (!eventInstance) {
      throw new Error(`Event instance ${sanityEventInstanceId} not found`);
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
      eventInstance: {
        _type: "reference",
        _ref: sanityEventInstanceId,
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
  }
};
