import { z } from "zod";

import { builder } from "~/builder";
import { selectSessionSchema } from "~/datasources/db/sessions";
import { selectSpeakerSchema } from "~/datasources/db/speaker";
import { sessionsFetcher } from "~/schema/sessions/sessionsFetcher";
import { SessionLoadable } from "~/schema/sessions/types";
import { speakersFetcher } from "~/schema/speakers/speakersFetcher";

type SpeakerGraphqlSchema = z.infer<typeof selectSpeakerSchema>;
export const SpeakerRef = builder.objectRef<SpeakerGraphqlSchema>("Speaker");

export const SpeakerLoadable = builder.loadableObject(SpeakerRef, {
  description: "Representation of a Speaker",
  load: (ids: string[], context) =>
    speakersFetcher.searchSpeakers({
      DB: context.DB,
      search: { speakerIds: ids },
      sort: null,
    }),
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    name: t.exposeString("name", { nullable: false }),
    bio: t.exposeString("bio", { nullable: true }),
    avatar: t.exposeString("avatar", { nullable: true }),
    socials: t.field({
      type: ["String"],
      resolve: (root) => {
        const socials = root.socials;

        return socials;
      },
    }),
    sessions: t.field({
      type: [SessionLoadable],
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
