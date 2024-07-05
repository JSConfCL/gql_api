import {
  SQL,
  eq,
  and,
  gte,
  ilike,
  lte,
  sql,
  exists,
  inArray,
} from "drizzle-orm";

import { builder } from "~/builder";
import {
  eventsSchema,
  selectEventsSchema,
  ticketsSchema,
  userTicketsSchema,
} from "~/datasources/db/schema";
import { paginationDBHelper } from "~/datasources/helpers/paginationQuery";
import {
  createPaginationInputType,
  createPaginationObjectType,
} from "~/schema/pagination/types";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";
import { EventRef } from "~/schema/shared/refs";

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
    // args: {
    //   input: t.arg({ type: EventsSearchInput, required: false }),
    // },
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
      const wheres: SQL[] = [];

      const query = ctx.DB.select().from(eventsSchema);

      if (id) {
        wheres.push(eq(eventsSchema.id, id));
      }

      if (name) {
        wheres.push(ilike(eventsSchema.name, sanitizeForLikeSearch(name)));
      }

      if (userHasTickets) {
        const subquery = ctx.DB.select({
          id: ticketsSchema.id,
        })
          .from(ticketsSchema)
          .where(and(eq(ticketsSchema.eventId, eventsSchema.id)));

        const existsQuery = exists(
          ctx.DB.select({
            ticket_template_id: userTicketsSchema.ticketTemplateId,
          })
            .from(userTicketsSchema)
            .where(inArray(userTicketsSchema.ticketTemplateId, subquery)),
        );

        wheres.push(existsQuery);
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

      const { data, pagination } = await paginationDBHelper(
        ctx.DB,
        query.where(and(...wheres)),
        input.pagination,
      );

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
);
