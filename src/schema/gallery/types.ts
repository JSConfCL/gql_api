import { builder } from "~/builder";
import {
  selectEventsSchema,
  selectGalleriesSchema,
  selectImagesSchema,
} from "~/datasources/db/schema";
import { ImageRef } from "~/schema/image/types";
import { EventRef } from "~/schema/shared/refs";

type GalleryGraphqlSchema = typeof selectGalleriesSchema._type;

export const GalleryRef = builder.objectRef<GalleryGraphqlSchema>("Gallery");

builder.objectType(GalleryRef, {
  description: "Representation of a Gallery, usually associated to an event",
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    event: t.field({
      type: EventRef,
      nullable: true,
      resolve: async ({ eventId }, args, { DB }) => {
        if (!eventId) {
          return null;
        }

        const event = await DB.query.eventsSchema.findFirst({
          where: (e, { eq }) => eq(e.id, eventId),
        });

        if (!event) {
          return null;
        }

        return selectEventsSchema.parse(event);
      },
    }),
    images: t.field({
      type: [ImageRef],
      resolve: async ({ id }, args, { DB }) => {
        const images = await DB.query.imagesSchema.findMany({
          where: (i, { eq }) => eq(i.galleryId, id),
        });

        if (!images || images.length === 0) {
          return [];
        }

        return images.map((image) => selectImagesSchema.parse(image));
      },
    }),
  }),
});
