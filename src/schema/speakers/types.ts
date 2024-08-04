import { builder } from "~/builder";
import { selectSessionSchema } from "~/datasources/db/sessions";
import { sessionsFetcher } from "~/schema/sessions/sessionsFetcher";
import { SpeakerRef, SessionRef } from "~/schema/shared/refs";

export const SpeakerLoadable = builder.loadableObject(SpeakerRef, {
  description: "Representation of a Speaker",
  load: (ids: string[], context) =>
    context.DB.query.speakerSchema.findMany({
      where: (speaker, { inArray }) => inArray(speaker.id, ids),
    }),
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    name: t.exposeString("name", { nullable: false }),
    bio: t.exposeString("bio", { nullable: true }),
    avatar: t.exposeString("avatar", { nullable: true }),
    socials: t.field({
      type: [String],
      resolve: (root) => {
        const socials = root.socials;

        console.log("socials", socials);

        return [];
      },
    }),
    sessions: t.field({
      type: [SessionRef],
      resolve: async (root, args, ctx) => {
        const sessions = await sessionsFetcher.searchSessions({
          DB: ctx.DB,
          search: { speakerIds: [root.id] },
        });

        return sessions.map((s) => selectSessionSchema.parse(s));
      },
    }),
  }),
});

export const SpeakerSearch = builder.inputType("SpeakerSearch", {
  fields: (t) => ({
    speakerIds: t.stringList({ required: false }),
    name: t.string({ required: false }),
    bio: t.string({ required: false }),
    eventIds: t.stringList({ required: false }),
    sessionIds: t.stringList({ required: false }),
  }),
});
