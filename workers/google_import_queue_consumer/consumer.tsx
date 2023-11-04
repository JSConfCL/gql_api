import { createClient } from "@sanity/client";
import { ensureKeys } from "../utils";
import { GoogleMediaItemType } from "../../src/datasources/google/photos";

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

export const queueConsumer: ExportedHandlerQueueHandler<
  ENV,
  GoogleMediaItemType
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
    // sanityClient.assets.upload("image", msg.body);
    // console.log("Processing message", msg);
  }
};
