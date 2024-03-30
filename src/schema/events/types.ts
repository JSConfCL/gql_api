import { SQL, eq, inArray } from "drizzle-orm";

import { authHelpers } from "~/authz/helpers";
import { builder } from "~/builder";
import {
  selectCommunitySchema,
  selectTagsSchema,
  selectTicketSchema,
  selectUserTicketsSchema,
  selectUsersSchema,
  ticketsSchema,
  userTicketsSchema,
  usersSchema,
} from "~/datasources/db/schema";
import { getImagesBySanityEventId } from "~/datasources/sanity/images";
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
} from "~/schema/userTickets/types";

export const EventStatus = builder.enumType("EventStatus", {
  values: ["active", "inactive"] as const,
});
export const EventVisibility = builder.enumType("EventVisibility", {
  values: ["public", "private", "unlisted"] as const,
});
const AdminRoles = new Set(["admin", "collaborator"]);

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
      description:
        "List of tickets for sale or redemption for this event. (If you are looking for a user's tickets, use the usersTickets field)",
      type: [TicketRef],
      resolve: async (root, _, { DB, USER }) => {
        const wheres: SQL[] = [];
        wheres.push(eq(ticketsSchema.eventId, root.id));

        // If the user is an admin, they can see all tickets, otherwise, only
        // active tickets are shown.
        let statusCheck = eq(ticketsSchema.status, "active");
        let visibilityCheck = eq(ticketsSchema.visibility, "public");
        if (USER) {
          const eventCommunity =
            await DB.query.eventsToCommunitiesSchema.findFirst({
              where: (etc, { eq }) => eq(etc.eventId, root.id),
              with: {
                community: true,
              },
            });
          if (eventCommunity) {
            const isAdmin = await authHelpers.isCommuntiyAdmin({
              user: USER,
              communityId: eventCommunity.communityId,
              DB,
            });
            if (isAdmin) {
              statusCheck = inArray(ticketsSchema.status, [
                "active",
                "inactive",
              ]);
              visibilityCheck = inArray(ticketsSchema.visibility, [
                "public",
                "private",
                "unlisted",
              ]);
            }
          }
        }

        wheres.push(statusCheck);
        wheres.push(visibilityCheck);
        const tickets = await DB.query.ticketsSchema.findMany({
          where: (_, { and }) => and(...wheres),
          orderBy(fields, operators) {
            return operators.asc(fields.createdAt);
          },
        });

        return tickets.map((t) => selectTicketSchema.parse(t));
      },
    }),
    usersTickets: t.field({
      description: "List of tickets that a user owns for this event.",
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
