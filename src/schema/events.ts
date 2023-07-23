import {
  eventsSchema,
  selectCommunitySchema,
  selectEventsSchema,
  selectTagsSchema,
  selectUsersSchema,
} from "~/datasources/db/schema";
import { SQL, eq, gte, like, lte } from "drizzle-orm";
import { CommunityRef, EventRef, TagRef, UserRef } from "~/schema/refs";
import { builder } from "~/builder";

export const EventStatus = builder.enumType("EventStatus", {
  values: ["active", "inactive"] as const,
});

export const EventVisibility = builder.enumType("EventVisibility", {
  values: ["public", "private", "unlisted"] as const,
});

builder.objectType(EventRef, {
  description:
    "Representation of an Event (Events and Users, is what tickets are linked to)",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: false }),
    description: t.exposeString("description", { nullable: true }),
    // visibility: t.exposeString("visibility", { nullable: false }),

    status: t.field({
      type: EventStatus,
      nullable: false,
      resolve: (root) => root.status,
    }),
    visibility: t.field({
      type: EventVisibility,
      nullable: false,
      resolve: (root) => root.visibility,
    }),
    startDateTime: t.field({
      type: "DateTime",
      nullable: false,
      resolve: (root) => root.startDateTime,
    }),
    endDateTime: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (root) => root.endDateTime,
    }),
    community: t.field({
      type: CommunityRef,
      nullable: true,
      resolve: async (root, args, ctx) => {
        const community = await ctx.DB.query.communitySchema.findFirst({
          with: {
            eventsToCommunities: {
              where: (etc, { eq }) => eq(etc.eventId, root.id),
            },
          },
        });
        if (!community) {
          return null;
        }
        return selectCommunitySchema.parse(community);
      },
    }),
    users: t.field({
      type: [UserRef],
      resolve: async (root, args, ctx) => {
        const users = await ctx.DB.query.usersSchema.findMany({
          with: {
            usersToCommunities: {
              where: (utc, { eq }) => eq(utc.userId, root.id),
            },
          },
        });
        if (!users) {
          return [];
        }
        return users.map((u) => selectUsersSchema.parse(u));
      },
    }),
    tags: t.field({
      type: [TagRef],
      resolve: async (root, args, ctx) => {
        const tags = await ctx.DB.query.tagsSchema.findMany({
          with: {
            tagsToEvents: {
              where: (tte, { eq }) => eq(tte.eventId, root.id),
            },
          },
        });
        if (!tags) {
          return [];
        }
        return tags.map((t) => selectTagsSchema.parse(t));
      },
    }),
  }),
});

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
      if (!input) {
        return [];
      }
      const {
        id,
        name,
        status,
        visibility,
        startDateTimeFrom,
        startDateTimeTo,
      } = input;
      const wheres: SQL[] = [];
      if (id) {
        wheres.push(eq(eventsSchema.id, id));
      }
      if (name) {
        const sanitizedName = name.replace(/[%_]/g, "\\$&");
        const searchName = `%${sanitizedName}%`;
        wheres.push(like(eventsSchema.name, searchName));
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
          return operators.desc(fields.createdAt);
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
      if (!id) {
        return null;
      }
      const event = await ctx.DB.query.eventsSchema.findFirst({
        where: (c, { eq }) => eq(c.id, id),
        orderBy(fields, operators) {
          return operators.desc(fields.createdAt);
        },
      });
      if (!event) {
        return null;
      }
      return selectEventsSchema.parse(event);
    },
  }),
}));
