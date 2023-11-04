import { createClient } from "@sanity/client";
import { ensureKeys } from "../utils";

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
    token: process.env.SANITY_SECRET_TOKEN, // Only if you want to update content with the client
  });

export const queueConsumer: ExportedHandlerQueueHandler<ENV> = async (
  batch,
  env,
) => {
  ensureKeys(env);
  const sanityClient = getSanityClient(env);
  console.log("Processing queue", batch.queue);
  for await (const msg of batch.messages) {
    sanityClient.assets.upload("image", msg.data);
    // console.log("Processing message", msg);
  }
};
