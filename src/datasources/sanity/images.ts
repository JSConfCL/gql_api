import { SanityClient } from "@sanity/client";

import { SanityAsset } from "./types";
import { SanityAssetZodSchema } from "./zod";

export const getImagesBySanityEventId = async ({
  client,
  sanityEventId,
}: {
  client: SanityClient;
  sanityEventId: string | null;
}): Promise<SanityAsset[]> => {
  if (!sanityEventId) {
    return [];
  }
  const images = await client.fetch<
    {
      id: string;
      url: string;
      originalFilename: string;
      size: number;
      title: string;
      assetId: string;
      path: string;
    }[]
  >(
    `*[_type == 'eventImage' && event._ref == $eventId]{
      "id": _id,
      "assetId": image.asset->_id,
      "path": image.asset->path,
      "url": image.asset->url,
      "originalFilename": image.asset->originalFilename,
      "size": image.asset->size,
      title,
    }`,
    {
      eventId: sanityEventId,
    },
  );
  return images
    .map((image) => {
      const parsed = SanityAssetZodSchema.safeParse({
        id: image.id,
        url: image.url,
        originalFilename: image.originalFilename,
        size: image.size,
        title: image.title,
        assetId: image.assetId,
        path: image.path,
      });
      if (parsed.success) {
        return parsed.data;
      }
      return null;
    })
    .filter(Boolean);
};
