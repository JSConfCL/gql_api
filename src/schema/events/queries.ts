import { builder } from "~/builder";
import { selectEventsSchema, selectUsersSchema } from "~/datasources/db/schema";
import { eventsFetcher } from "~/schema/events/eventsFetcher";
import {
  createPaginationInputType,
  createPaginationObjectType,
} from "~/schema/pagination/types";
import { EventRef, PublicEventAttendanceRef } from "~/schema/shared/refs";

import { EventStatus, EventVisibility } from "./types";

const EventsSearchInput = builder.inputType("EventsSearchInput", {
  fields: (t) => ({
    id: t.string({ required: false }),
    name: t.string({ required: false }),
    userHasTickets: t.boolean({ required: false }),
    status: t.field({
      type: EventStatus,
      required: false,
    }),
    ticketTags: t.field({
      type: ["String"],
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

const PaginatedEventRef = createPaginationObjectType(EventRef);

builder.queryField("searchEvents", (t) =>
  t.field({
    description: "Get a list of events. Filter by name, id, status or date",
    type: PaginatedEventRef,
    args: createPaginationInputType(t, EventsSearchInput),
    resolve: async (root, { input }, ctx) => {
      const {
        id,
        name,
        status,
        visibility,
        startDateTimeFrom,
        startDateTimeTo,
        userHasTickets,
      } = input?.search ?? {};

      const { data, pagination } = await eventsFetcher.searchPaginatedEvents({
        DB: ctx.DB,
        pagination: input.pagination,
        search: {
          userId: ctx.USER?.id,
          eventIds: id ? [id] : undefined,
          eventName: name ?? undefined,
          eventStatus: status ? [status] : undefined,
          eventVisibility: visibility ? [visibility] : undefined,
          startDateTimeFrom: startDateTimeFrom ?? undefined,
          startDateTimeTo: startDateTimeTo ?? undefined,
          userHasTickets: userHasTickets ?? false,
        },
      });

      const parsedResults = data.map((u) => selectEventsSchema.parse(u));

      return {
        data: parsedResults,
        pagination,
      };
    },
  }),
);

builder.queryField("event", (t) =>
  t.field({
    description: "Get an event by id",
    type: EventRef,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      const { id } = args;
      const events = await eventsFetcher.searchEvents({
        DB: ctx.DB,
        search: {
          eventIds: [id],
        },
      });

      const event = events[0];

      if (!event) {
        return null;
      }

      return selectEventsSchema.parse(event);
    },
  }),
);

const PublicEventAttendanceInfo = builder.inputType(
  "PublicEventAttendanceInfo",
  {
    fields: (t) => ({
      id: t.string({ required: true }),
    }),
  },
);

builder.queryField("publicEventAttendanceInfo", (t) =>
  t.field({
    description: "Get public event attendance info",
    type: PublicEventAttendanceRef,
    args: {
      input: t.arg({ type: PublicEventAttendanceInfo, required: true }),
    },
    nullable: true,
    resolve: async (root, args, { DB }) => {
      const PO = await DB.query.purchaseOrdersSchema.findFirst({
        where: (po, { eq }) => eq(po.publicId, args.input.id),
        with: {
          user: true,
          userTickets: {
            with: {
              ticketTemplate: {
                with: {
                  event: true,
                },
              },
            },
          },
        },
      });

      const event = PO?.userTickets?.[0]?.ticketTemplate?.event;
      const user = PO?.user;

      if (!event || !user) {
        return null;
      }

      const cleanedUser = selectUsersSchema.parse(user);
      const cleanedEvent = selectEventsSchema.parse(event);

      return {
        publicId: PO.publicId,
        user: cleanedUser,
        event: cleanedEvent,
      };
    },
  }),
);
