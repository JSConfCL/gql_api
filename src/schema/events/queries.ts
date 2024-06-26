import { SQL, eq, gte, ilike, lte } from "drizzle-orm";

import { builder } from "~/builder";
import { eventsSchema, selectEventsSchema } from "~/datasources/db/schema";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";
import { EventRef } from "~/schema/shared/refs";

import { EventStatus, EventVisibility } from "./types";

const EventsSearchInput = builder.inputType("EventsSearchInput", {
  fields: (t) => ({
    id: t.string({ required: false }),
    name: t.string({ required: false }),
    status: t.field({
      type: EventStatus,
      required: false,
    }),
    visibility: t.field({
      type: EventVisibility,
      required: false,
    }),
    startDateTimeFrom: t.field({
      type: "DateTime",
      required: false,
    }),
    startDateTimeTo: t.field({
      type: "DateTime",
      required: false,
    }),
  }),
});

builder.queryFields((t) => ({
  events: t.field({
    description: "Get a list of events. Filter by name, id, status or date",
    type: [EventRef],
    args: {
      input: t.arg({ type: EventsSearchInput, required: false }),
    },
    resolve: async (root, { input }, ctx) => {
      const {
        id,
        name,
        status,
        visibility,
        startDateTimeFrom,
        startDateTimeTo,
      } = input ?? {};
      const wheres: SQL[] = [];

      if (id) {
        wheres.push(eq(eventsSchema.id, id));
      }

      if (name) {
        wheres.push(ilike(eventsSchema.name, sanitizeForLikeSearch(name)));
      }

      if (status) {
        wheres.push(eq(eventsSchema.status, status));
      }

      if (visibility) {
        wheres.push(eq(eventsSchema.visibility, visibility));
      }

      if (startDateTimeFrom) {
        wheres.push(gte(eventsSchema.startDateTime, startDateTimeFrom));
      }

      if (startDateTimeTo) {
        wheres.push(lte(eventsSchema.startDateTime, startDateTimeTo));
      }

      const events = await ctx.DB.query.eventsSchema.findMany({
        where: (c, { and }) => and(...wheres),
        orderBy(fields, operators) {
          return operators.asc(fields.createdAt);
        },
      });

      return events.map((u) => selectEventsSchema.parse(u));
    },
  }),
  event: t.field({
    description: "Get an event by id",
    type: EventRef,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      const { id } = args;
      const event = await ctx.DB.query.eventsSchema.findFirst({
        where: (c, { eq }) => eq(c.id, id),
        orderBy(fields, operators) {
          return operators.asc(fields.createdAt);
        },
      });

      if (!event) {
        return null;
      }

      return selectEventsSchema.parse(event);
    },
  }),
}));
