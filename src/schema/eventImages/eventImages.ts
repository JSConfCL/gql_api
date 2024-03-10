import { builder } from "~/builder";
import { getImagesBySanityEventId } from "~/datasources/sanity/images";
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
      const event = await ctx.DB.query.eventsSchema.findFirst({
        where: (c, { eq }) => eq(c.id, eventId),
        orderBy(fields, operators) {
          return operators.asc(fields.createdAt);
        },
      });
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
