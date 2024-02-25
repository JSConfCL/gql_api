/* eslint-disable no-console */
import { createClient } from "@sanity/client";

let client: ReturnType<typeof createClient>;

export const getSanityClient = ({
  useCdn,
  projectId,
  dataset,
  apiVersion,
  token,
}: {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token: string;
  useCdn: boolean;
}) => {
  if (!client) {
    client = createClient({
      projectId,
      dataset,
      useCdn,
      apiVersion,
      token,
    });
  }
  return client;
};
