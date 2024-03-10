import { SQL, eq, gte, ilike, lte, inArray } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  eventsSchema,
  eventsToCommunitiesSchema,
  insertEventsSchema,
  selectCommunitySchema,
  selectEventsSchema,
  selectTagsSchema,
  selectTicketSchema,
  selectUserTicketsSchema,
  selectUsersSchema,
  updateEventsSchema,
  userTicketsSchema,
  usersSchema,
} from "~/datasources/db/schema";
import { getImagesBySanityEventId } from "~/datasources/sanity/images";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";
import {
  CommunityRef,
  EventRef,
  SanityAssetRef,
  TagRef,
  TicketRef,
  UserRef,
  UserTicketRef,
} from "~/schema/shared/refs";
import {
  TicketApprovalStatus,
  TicketPaymentStatus,
  TicketRedemptionStatus,
  TicketStatus,
} from "~/schema/userTickets/userTickets";
import { canCreateEvent, canEditEvent } from "~/validations";

export const EventStatus = builder.enumType("EventStatus", {
  values: ["active", "inactive"] as const,
});
export const EventVisibility = builder.enumType("EventVisibility", {
  values: ["public", "private", "unlisted"] as const,
});
const AdminRoles = new Set(["admin", "collaborator"]);

builder.objectType(EventRef, {
  description:
    "Representation of an Event (Events and Users, is what tickets are linked to)",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: false }),
    description: t.exposeString("description", { nullable: true }),
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
      resolve: (root) => new Date(root.startDateTime),
    }),
    endDateTime: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (root) => (root.endDateTime ? new Date(root.endDateTime) : null),
    }),
    images: t.field({
      type: [SanityAssetRef],
      resolve: async ({ sanityEventId }, args, ctx) => {
        const client = ctx.GET_SANITY_CLIENT();
        return getImagesBySanityEventId({
          client,
          sanityEventId,
        });
      },
    }),
    meetingURL: t.exposeString("meetingURL", { nullable: true }),
    maxAttendees: t.exposeInt("maxAttendees", { nullable: true }),
    latitude: t.exposeString("geoLatitude", { nullable: true }),
    longitude: t.exposeString("geoLongitude", { nullable: true }),
    address: t.exposeString("geoAddressJSON", { nullable: true }),
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
        const wheres: SQL[] = [];

        const eventToCommunitie =
          await ctx.DB.query.eventsToCommunitiesSchema.findFirst({
            where: (etc, { eq }) => eq(etc.eventId, root.id),
          });

        if (!eventToCommunitie) {
          return [];
        }

        const usersToCommunitie =
          await ctx.DB.query.usersToCommunitiesSchema.findMany({
            where: (utc, { eq }) =>
              eq(utc.communityId, eventToCommunitie.communityId),
          });

        const usersToCommunitieIds = usersToCommunitie
          .map((utc) => utc.userId)
          .filter(Boolean);

        if (usersToCommunitieIds.length === 0) {
          return [];
        }

        wheres.push(inArray(usersSchema.id, usersToCommunitieIds));
        const users = await ctx.DB.query.usersSchema.findMany({
          where: (c, { and }) => and(...wheres),
          orderBy(fields, operators) {
            return operators.asc(fields.username);
          },
        });
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
          orderBy(fields, operators) {
            return operators.desc(fields.name);
          },
        });
        return tags.map((t) => selectTagsSchema.parse(t));
      },
    }),
    tickets: t.field({
      type: [TicketRef],
      authz: {
        rules: ["IsAuthenticated"],
      },
      resolve: async (root, args, { DB }) => {
        const tickets = await DB.query.ticketsSchema.findMany({
          where: (c, { eq }) => eq(c.eventId, root.id),
          orderBy(fields, operators) {
            return operators.asc(fields.createdAt);
          },
        });

        return tickets.map((t) => selectTicketSchema.parse(t));
      },
    }),
    usersTickets: t.field({
      type: [UserTicketRef],
      authz: {
        rules: ["IsAuthenticated"],
      },
      args: {
        input: t.arg({ type: EventsTicketsSearchInput, required: false }),
      },
      resolve: async (root, { input }, { DB, USER }) => {
        const { id, status, paymentStatus, approvalStatus, redemptionStatus } =
          input ?? {};
        const wheres: SQL[] = [];

        if (!USER) {
          return [];
        }

        if (id) {
          wheres.push(eq(userTicketsSchema.id, id));
        }
        if (status) {
          wheres.push(eq(userTicketsSchema.status, status));
        }
        if (paymentStatus) {
          wheres.push(eq(userTicketsSchema.paymentStatus, paymentStatus));
        }
        if (approvalStatus) {
          wheres.push(eq(userTicketsSchema.approvalStatus, approvalStatus));
        }
        if (redemptionStatus) {
          wheres.push(eq(userTicketsSchema.redemptionStatus, redemptionStatus));
        }
        const roleUserEvent = await DB.query.eventsToUsersSchema.findFirst({
          where: (etc, { eq, and }) =>
            and(eq(etc.eventId, root.id), eq(etc.userId, USER.id)),
        });
        const community = await DB.query.eventsToCommunitiesSchema.findFirst({
          where: (etc, { eq }) => eq(etc.eventId, root.id),
        });
        if (!community) {
          return [];
        }
        const roleUserCommunity =
          await DB.query.usersToCommunitiesSchema.findFirst({
            where: (etc, { eq, and }) =>
              and(
                eq(etc.communityId, community?.communityId),
                eq(etc.userId, USER.id),
              ),
          });
        if (
          !(roleUserEvent?.role && AdminRoles.has(roleUserEvent.role)) ||
          !(roleUserCommunity?.role && AdminRoles.has(roleUserCommunity.role))
        ) {
          wheres.push(eq(userTicketsSchema.userId, USER.id));
        }

        // TODO: (Felipe) — Esta es otra manera de hacerlo, aun no se cual es
        // mejor. La diferencia es que con esta query, no es facil obtener un
        // tipado fuerte en comparación a las relational queries.
        // https://orm.drizzle.team/docs/rqb
        //
        // Es probable que podamos hacerlo si usamos el builder de drizzle-orm
        // para generar el schema de la query, pero aun no lo he intentado.
        //
        // const withJoin = await DB.select()
        //   .from(eventsSchema)
        //   .innerJoin(ticketsSchema, eq(eventsSchema.id, ticketsSchema.eventId))
        //   .innerJoin(
        //     userTicketsSchema,
        //     eq(ticketsSchema.id, userTicketsSchema.ticketTemplateId),
        //   )
        //   .where(eq(eventsSchema.id, root.id))
        //   .run();

        const ticketsTemplates = await DB.query.ticketsSchema.findMany({
          where: (c, { eq }) => eq(c.eventId, root.id),
        });
        const ticketTemplateIds = ticketsTemplates.map((t) => t.id);
        if (ticketTemplateIds.length === 0) {
          return [];
        }

        wheres.push(
          inArray(userTicketsSchema.ticketTemplateId, ticketTemplateIds),
        );
        const tickets = await DB.query.userTicketsSchema.findMany({
          where: (c, { and }) => and(...wheres),
          orderBy(fields, operators) {
            return operators.asc(fields.createdAt);
          },
        });

        return tickets.map((t) => selectUserTicketsSchema.parse(t));
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

const EventsTicketsSearchInput = builder.inputType("EventsTicketsSearchInput", {
  fields: (t) => ({
    id: t.string({ required: false }),
    status: t.field({
      type: TicketStatus,
      required: false,
    }),
    paymentStatus: t.field({
      type: TicketPaymentStatus,
      required: false,
    }),
    approvalStatus: t.field({
      type: TicketApprovalStatus,
      required: false,
    }),
    redemptionStatus: t.field({
      type: TicketRedemptionStatus,
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

const EventCreateInput = builder.inputType("EventCreateInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: true }),
    communityId: t.string({ required: true }),
    status: t.field({
      type: EventStatus,
      required: false,
    }),
    visibility: t.field({
      type: EventVisibility,
      required: false,
    }),
    startDateTime: t.field({
      type: "DateTime",
      required: true,
    }),
    endDateTime: t.field({
      type: "DateTime",
      required: false,
    }),
    timeZone: t.string({ required: false }),
    latitude: t.string({ required: false }),
    longitude: t.string({ required: false }),
    address: t.string({ required: false }),
    meetingURL: t.string({ required: false }),
    maxAttendees: t.field({
      type: "Int",
      required: true,
    }),
  }),
});

const EventEditInput = builder.inputType("EventEditInput", {
  fields: (t) => ({
    eventId: t.string({ required: true }),
    name: t.string({ required: false }),
    description: t.string({ required: false }),
    status: t.field({
      type: EventStatus,
      required: false,
    }),
    visibility: t.field({
      type: EventVisibility,
      required: false,
    }),
    startDateTime: t.field({
      type: "DateTime",
      required: false,
    }),
    endDateTime: t.field({
      type: "DateTime",
      required: false,
    }),
    timeZone: t.string({ required: false }),
    latitude: t.string({ required: false }),
    longitude: t.string({ required: false }),
    address: t.string({ required: false }),
    meetingURL: t.string({ required: false }),
    maxAttendees: t.field({
      type: "Int",
      required: false,
    }),
  }),
});

builder.mutationFields((t) => ({
  createEvent: t.field({
    description: "Create an event",
    type: EventRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: EventCreateInput, required: true }),
    },
    resolve: async (root, { input }, ctx) => {
      try {
        const {
          name,
          description,
          visibility,
          startDateTime,
          endDateTime,
          communityId,
          maxAttendees,
          address,
          latitude,
          longitude,
          meetingURL,
          status,
          timeZone,
        } = input;
        if (!ctx.USER) {
          throw new Error("User not found");
        }
        if (!(await canCreateEvent(ctx.USER.id, communityId, ctx.DB))) {
          throw new Error("FORBIDDEN");
        }
        const result = await ctx.DB.transaction(async (trx) => {
          try {
            const newEvent = insertEventsSchema.parse({
              name,
              description,
              visibility,
              startDateTime,
              endDateTime,
              maxAttendees,
              geoAddressJSON: address,
              geoLongitude: longitude,
              getLatitude: latitude,
              meetingURL,
              status: status ?? "inactive",
              timeZone,
            });

            const events = (
              await trx.insert(eventsSchema).values(newEvent).returning()
            )?.[0];

            await trx.insert(eventsToCommunitiesSchema).values({
              eventId: events.id,
              communityId: communityId,
            });

            return events;
          } catch (e) {
            trx.rollback();
            throw new GraphQLError(
              e instanceof Error ? e.message : "Unknown error",
            );
          }
        });
        return selectEventsSchema.parse(result);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
  editEvent: t.field({
    description: "Edit an event",
    type: EventRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: EventEditInput, required: true }),
    },
    resolve: async (root, { input }, ctx) => {
      try {
        const {
          eventId,
          name,
          description,
          visibility,
          startDateTime,
          endDateTime,
          maxAttendees,
          address,
          latitude,
          longitude,
          meetingURL,
          status,
          timeZone,
        } = input;
        if (!ctx.USER) {
          throw new Error("User not found");
        }
        if (!(await canEditEvent(ctx.USER.id, eventId, ctx.DB))) {
          throw new Error("FORBIDDEN");
        }
        const updateValues = updateEventsSchema.safeParse({
          name,
          description,
          visibility,
          startDateTime,
          endDateTime,
          maxAttendees,
          geoAddressJSON: address,
          geoLongitude: longitude,
          geoLatitude: latitude,
          meetingURL,
          status,
          timeZone,
        });
        if (!updateValues.success) {
          throw new Error("Invalid input");
        }
        const event = (
          await ctx.DB.update(eventsSchema)
            .set(updateValues.data)
            .where(eq(eventsSchema.id, eventId))
            .returning()
        )?.[0];

        return selectEventsSchema.parse(event);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
}));
