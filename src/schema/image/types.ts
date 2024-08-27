import { builder } from "~/builder";
import {
  imageHostingEnum,
  selectGalleriesSchema,
  selectImagesSchema,
} from "~/datasources/db/schema";
import { GalleryRef } from "~/schema/gallery/types";

type ImageGraphqlSchema = typeof selectImagesSchema._type;

export const ImageRef = builder.objectRef<ImageGraphqlSchema>("Image");

export const publicImageHostingEnum = builder.enumType(imageHostingEnum, {
  name: "ImageHostingEnum",
});

builder.objectType(ImageRef, {
  description: "An image, usually associated to a gallery",
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    url: t.exposeString("url"),
    hosting: t.field({
      type: publicImageHostingEnum,
      resolve: (root) => root.hosting,
    }),
    gallery: t.field({
      type: GalleryRef,
      nullable: true,
      resolve: async ({ galleryId }, args, { DB }) => {
        if (!galleryId) {
          return null;
        }

        const gallery = await DB.query.galleriesSchema.findFirst({
          where: (g, { eq }) => eq(g.id, galleryId),
        });

        if (!gallery) {
          return null;
        }

        return selectGalleriesSchema.parse(gallery);
      },
    }),
  }),
});
