import { SanityAssetRef } from "~/schema/shared/refs";
import { builder } from "~/builder";
import { SanityAsset } from "../datasources/sanity/types";

const EventImageSearch = builder.inputType("EventImageSearch", {
  description: "Search for tags",
  fields: (t) => ({
    eventId: t.string({
      required: true,
    }),
  }),
});

builder.queryFields((t) => ({
  eventImages: t.field({
    description: "Get a list of images, that are attached to an event",
    type: [SanityAssetRef],
    args: {
      input: t.arg({ type: EventImageSearch, required: true }),
    },
    resolve: async (root, args, ctx) => {
      const { eventId } = args.input || {};
      if (!eventId) {
        return [];
      }
      const event = await ctx.DB.query.eventsSchema.findFirst({
        where: (c, { eq }) => eq(c.id, eventId),
        orderBy(fields, operators) {
          return operators.asc(fields.createdAt);
        },
      });
      if (!event) {
        return [];
      }
      console.log("event", event);
      const sanityClient = ctx.GET_SANITY_CLIENT();
      const images = await sanityClient.fetch<
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
          eventId: event.sanityEventId,
        },
      );
      return images.map((image) => {
        return {
          id: image.id,
          assetId: image.assetId,
          path: image.path,
          url: image.url,
          originalFilename: image.originalFilename,
          size: image.size,
        } satisfies SanityAsset;
      });
    },
  }),
}));
