import { builder } from "~/builder";
import { SanityAssetRef } from "~/schema/shared/refs";
import {
  GoogleMediaItemType,
  getAlbumImages,
} from "../datasources/google/photos";
import {
  GoogleImportQueueElement,
  enqueueGooglePhotoImageBatch,
} from "../datasources/queues/google_import";

builder.objectType(SanityAssetRef, {
  description: "Representation of a Sanity Asset",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    assetId: t.exposeString("assetId", { nullable: false }),
    path: t.exposeString("path", { nullable: false }),
    url: t.exposeString("url", { nullable: false }),
    originalFilename: t.exposeString("originalFilename", { nullable: false }),
    size: t.exposeInt("size", { nullable: false }),
  }),
});

const EnqueueGoogleAlbumImportInput = builder.inputType(
  "EnqueueGoogleAlbumImportInput",
  {
    fields: (t) => ({
      albumId: t.string({ required: true }),
      sanityEventInstanceId: t.string({ required: true }),
      token: t.string({ required: true }),
    }),
  },
);

builder.mutationFields((t) => ({
  enqueueGoogleAlbumImport: t.field({
    // Recibimos un token de google, y un albumId. Esta mutación se encarga de
    // obtener todas las imágenes del album, y encolarlas en una cola de
    // cloudflare. Luego existe otro consumer, que se encarga de descargarlas y
    // meterlas en sanity.
    description: "Enqueue images to import",
    type: "Boolean",
    nullable: false,
    authz: {
      rules: ["IsAuthenticated", "IsSuperAdmin"],
    },
    args: {
      input: t.arg({ type: EnqueueGoogleAlbumImportInput, required: true }),
    },
    resolve: async (_, { input }, { GOOGLE_PHOTOS_IMPORT_QUEUE }) => {
      const { albumId, token, sanityEventInstanceId } = input;
      let shouldGetMore = true;
      let nextPageToken: string | undefined = undefined;
      const allImages: GoogleImportQueueElement[] = [];
      while (shouldGetMore) {
        const response: {
          mediaItems: Array<GoogleMediaItemType>;
          nextPageToken: string | undefined;
        } = await getAlbumImages(albumId, token, nextPageToken);
        response.mediaItems.forEach((mediaItem) => {
          allImages.push({
            googleMedia: mediaItem,
            sanityEventInstanceId,
          });
        });

        if (response.nextPageToken) {
          nextPageToken = response.nextPageToken;
        } else {
          shouldGetMore = false;
        }
      }
      await enqueueGooglePhotoImageBatch(GOOGLE_PHOTOS_IMPORT_QUEUE, allImages);
      return true;
    },
  }),
}));
