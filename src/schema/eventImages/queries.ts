import { builder } from "~/builder";
import { getImagesBySanityEventId } from "~/datasources/sanity/images";
import { eventsFetcher } from "~/schema/events/eventsFetcher";
import { SanityAssetRef } from "~/schema/shared/refs";

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

      const events = await eventsFetcher.searchEvents({
        DB: ctx.DB,
        search: {
          eventIds: [eventId],
        },
      });

      const event = events[0];

      if (!event) {
        return [];
      }

      const { sanityEventId } = event;
      const client = ctx.GET_SANITY_CLIENT();

      return getImagesBySanityEventId({
        client,
        sanityEventId,
      });
    },
  }),
}));
