import { GoogleMediaItemType } from "../../google/photos";
import pMap from "p-map";

const splitIntoChunks = <T>(array: T[], chunkSize: number) => {
  const chunks: T[][] = [];
  let i = 0;
  const n = array.length;
  while (i < n) {
    const slicedArray = array.slice(i, (i += chunkSize));
    chunks.push(slicedArray);
  }
  return chunks;
};
export const enqueueGooglePhotoImage = (
  GOOGLE_PHOTOS_IMPORT_QUEUE: Queue,
  googlePhotoMessage: GoogleMediaItemType,
) => {
  // Solo hacemos esto porque en nuestros tests de graphql, no tenemos una cola
  // de cloudflare queues. Así que en ves de enviar el email, asumimos que se
  // encola correctamente.
  if (!GOOGLE_PHOTOS_IMPORT_QUEUE) {
    return;
  }

  return GOOGLE_PHOTOS_IMPORT_QUEUE.send(googlePhotoMessage, {
    contentType: "json",
  });
};

export const enqueueGooglePhotoImageBatch = async (
  GOOGLE_PHOTOS_IMPORT_QUEUE: Queue,
  googlePhotoMessage: GoogleMediaItemType[],
) => {
  // Solo hacemos esto porque en nuestros tests de graphql, no tenemos una cola
  // de cloudflare queues. Así que en ves de enviar el email, asumimos que se
  // encola correctamente.
  if (!GOOGLE_PHOTOS_IMPORT_QUEUE) {
    return;
  }

  const batch = googlePhotoMessage.map((message) => {
    return {
      body: message,
      options: {
        contentType: "json",
      },
    };
  });
  const chunks = splitIntoChunks(batch, 100);
  return pMap(
    chunks,
    (chunk) => {
      return GOOGLE_PHOTOS_IMPORT_QUEUE.sendBatch(chunk);
    },
    { concurrency: 1 },
  );
};
