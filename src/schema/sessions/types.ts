import { z } from "zod";

import { builder } from "~/builder";
import {
  selectSessionSchema,
  selectSpeakerSchema,
} from "~/datasources/db/schema";
import { sessionsFetcher } from "~/schema/sessions/sessionsFetcher";
import { speakersFetcher } from "~/schema/speakers/speakersFetcher";
import { SpeakerRef } from "~/schema/speakers/types";

type SessionGraphqlSchema = z.infer<typeof selectSessionSchema>;

export const SessionRef = builder.objectRef<SessionGraphqlSchema>("Session");

export const SessionLoadable = builder.loadableObject(SessionRef, {
  description: "Representation of a Session",
  load: async (ids: string[], context) => {
    const result = await sessionsFetcher.searchSessions({
      DB: context.DB,
      search: { sessionIds: ids },
    });

    const resultByIdMap = new Map(result.map((item) => [item.id, item]));

    return ids.map(
      (id) => resultByIdMap.get(id) || new Error(`Session ${id} not found`),
    );
  },
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    title: t.exposeString("title", { nullable: false }),
    description: t.exposeString("description", { nullable: true }),
    startTimestamp: t.field({
      type: "DateTime",
      resolve: (root) => new Date(root.startTimestamp),
    }),
    endTimestamp: t.field({
      type: "DateTime",
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
