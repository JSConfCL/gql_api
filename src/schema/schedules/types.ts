import { z } from "zod";

import { builder } from "~/builder";
import {
  selectEventsSchema,
  selectScheduleSchema,
  selectSessionSchema,
} from "~/datasources/db/schema";
import { applicationError, ServiceErrors } from "~/errors";
import { EventLoadable } from "~/schema/events/types";
import { schedulesFetcher } from "~/schema/schedules/schedulesFetcher";
import { sessionsFetcher } from "~/schema/sessions/sessionsFetcher";
import { SessionRef } from "~/schema/sessions/types";
import { EventRef } from "~/schema/shared/refs";

type ScheduleraphqlSchema = z.infer<typeof selectScheduleSchema>;

export const ScheduleRef = builder.objectRef<ScheduleraphqlSchema>("Schedule");

export const ScheduleLoadable = builder.loadableObject(ScheduleRef, {
  description: "Representation of a Schedule",
  load: (ids: string[], context) =>
    schedulesFetcher.searchSchedules({
      DB: context.DB,
      search: { scheduleIds: ids },
    }),
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
    event: t.field({
      type: EventRef,
      resolve: async (root, args, ctx) => {
        const event = await EventLoadable.getDataloader(ctx).load(root.eventId);

        if (!event) {
          throw applicationError(
            "Event not found",
            ServiceErrors.NOT_FOUND,
            ctx.logger,
          );
        }

        return selectEventsSchema.parse(event);
      },
    }),
    sessions: t.field({
      type: [SessionRef],
      resolve: async (root, args, ctx) => {
        const sessions = await sessionsFetcher.searchSessions({
          DB: ctx.DB,
          search: {
            scheduleIds: [root.id],
          },
          sort: [["startTimestamp", "asc"]],
        });

        return sessions.map((s) => selectSessionSchema.parse(s));
      },
    }),
  }),
});
