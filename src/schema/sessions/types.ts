import { builder } from "~/builder";
import { selectSpeakerSchema } from "~/datasources/db/schema";
import { SessionRef, SpeakerRef } from "~/schema/shared/refs";
import { speakersFetcher } from "~/schema/speakers/speakersFetcher";

export const SessionLoadable = builder.loadableObject(SessionRef, {
  description: "Representation of a Session",
  load: (ids: string[], context) =>
    context.DB.query.sessionSchema.findMany({
      where: (session, { inArray }) => inArray(session.id, ids),
    }),
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    title: t.exposeString("title", { nullable: false }),
    description: t.exposeString("description", { nullable: true }),
    startTimestamp: t.field({
      type: "Date",
      resolve: (root) => new Date(root.startTimestamp),
    }),
    endTimestamp: t.field({
      type: "Date",
      resolve: (root) => new Date(root.endTimestamp),
    }),
    speakers: t.field({
      type: [SpeakerRef],
      resolve: async (root, args, ctx) => {
        const speakers = await speakersFetcher.searchSpeakers({
          DB: ctx.DB,
          search: { sessionIds: [root.id] },
        });

        return speakers.map((s) => selectSpeakerSchema.parse(s));
      },
    }),
  }),
});

export const SessionSearch = builder.inputType("SessionSearch", {
  fields: (t) => ({
    sessionIds: t.stringList({ required: false }),
    title: t.string({ required: false }),
    description: t.string({ required: false }),
    eventIds: t.stringList({ required: false }),
    speakerIds: t.stringList({ required: false }),
    startDate: t.string({ required: false }),
    endDate: t.string({ required: false }),
  }),
});
