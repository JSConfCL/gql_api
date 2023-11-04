import { builder } from "~/builder";
import { SanityAssetRef } from "~/schema/shared/refs";

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
      token: t.string({ required: true }),
    }),
  },
);

type GoogleMediaItemType = {
  id: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaMetadata: {
    creationTime: string;
    width: string;
    height: string;
    photo: {
      cameraMake: string;
      cameraModel: string;
      focalLength: number;
      apertureFNumber: number;
      isoEquivalent: number;
    };
  };
};

const getAlbumImages = async (
  albumId: string,
  token: string,
  pageToken?: string,
) => {
  const rawresponse = await fetch(
    "https://photoslibrary.googleapis.com/v1/mediaItems:search",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        albumId: albumId,
        pageSize: 100, // This specifies the number of items to return per page, maximum is 100
        ...(pageToken ? { pageToken } : {}), // This specifies the page token of the next page to return
      }),
    },
  );
  const response = await rawresponse.json();
  return response as {
    mediaItems: Array<GoogleMediaItemType>;
    nextPageToken: string | undefined;
  };
};

builder.mutationFields((t) => ({
  createCommunity: t.field({
    description: "Enqueue images to import",
    type: Boolean,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated", "IsSuperAdmin"],
    },
    args: {
      input: t.arg({ type: EnqueueGoogleAlbumImportInput, required: true }),
    },
    resolve: async (root, { input }, { USER, DB }) => {
      const { albumId, token } = input;
      let shouldGetMore = true;
      let nextPageToken: string | undefined = undefined;
      let allImages: GoogleMediaItemType[] = [];
      while (shouldGetMore) {
        const response: {
          mediaItems: Array<GoogleMediaItemType>;
          nextPageToken: string | undefined;
        } = await getAlbumImages(albumId, token, nextPageToken);
        allImages = [...allImages, ...response.mediaItems];
        if (response.nextPageToken) {
          nextPageToken = response.nextPageToken;
        } else {
          shouldGetMore = false;
        }
      }
      await getAlbumImages(albumId, token);
      // eslint-disable-next-line no-console
      console.log("allImages", allImages);
      return true;
    },
  }),
}));
