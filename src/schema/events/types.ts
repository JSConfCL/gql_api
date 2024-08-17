import { SQL, eq, inArray } from "drizzle-orm";

import { authHelpers } from "~/authz/helpers";
import { builder } from "~/builder";
import {
  selectCommunitySchema,
  selectScheduleSchema,
  selectSpeakerSchema,
  selectTagsSchema,
  selectTeamsSchema,
  selectTicketSchema,
  selectUserTicketsSchema,
  selectUsersSchema,
  ticketStatusEnum,
  ticketVisibilityEnum,
  ticketsSchema,
  usersSchema,
} from "~/datasources/db/schema";
import { getImagesBySanityEventId } from "~/datasources/sanity/images";
import { eventsFetcher } from "~/schema/events/eventsFetcher";
import { schedulesFetcher } from "~/schema/schedules/schedulesFetcher";
import { ScheduleLoadable, ScheduleRef } from "~/schema/schedules/types";
import {
  CommunityRef,
  EventRef,
  SanityAssetRef,
  TagRef,
  TicketRef,
  UserRef,
  UserTicketRef,
} from "~/schema/shared/refs";
import { speakersFetcher } from "~/schema/speakers/speakersFetcher";
import { SpeakerRef } from "~/schema/speakers/types";
import { teamsFetcher } from "~/schema/teams/teamsFetcher";
import { TeamRef } from "~/schema/teams/types";
import { ticketsFetcher } from "~/schema/ticket/ticketsFetcher";
import {
  TicketApprovalStatus,
  TicketPaymentStatus,
  TicketRedemptionStatus,
} from "~/schema/userTickets/types";
import { userTicketFetcher } from "~/schema/userTickets/userTicketFetcher";

export const eventStatus = ["active", "inactive"] as const;

export const EventStatus = builder.enumType("EventStatus", {
  values: eventStatus,
});

export const eventVisibility = ["public", "private", "unlisted"] as const;

export const EventVisibility = builder.enumType("EventVisibility", {
  values: eventVisibility,
});
// const AdminRoles = new Set(["admin", "collaborator"]);

const EventsTicketsSearchInput = builder.inputType("EventsTicketsSearchInput", {
  fields: (t) => ({
    id: t.string({ required: false }),
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

const EventsTicketTemplateSearchInput = builder.inputType(
  "EventsTicketTemplateSearchInput",
  {
    fields: (t) => ({
      tags: t.stringList({
        required: false,
      }),
    }),
  },
);

export const EventLoadable = builder.loadableObject(EventRef, {
  description:
    "Representation of an Event (Events and Users, is what tickets are linked to)",
  load: (ids: string[], context) =>
    eventsFetcher.searchEvents({
      DB: context.DB,
      search: { eventIds: ids },
      sort: null,
    }),
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
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
    teams: t.field({
      type: [TeamRef],
      resolve: async (root, args, ctx) => {
        if (!ctx.USER?.isSuperAdmin) {
          return [];
        }

        const teams = await teamsFetcher.getTeams({
          DB: ctx.DB,
          search: {
            eventIds: [root.id],
          },
        });

        return teams.map((t) => selectTeamsSchema.parse(t));
      },
    }),
    meetingURL: t.exposeString("meetingURL", { nullable: true }),
    latitude: t.exposeString("geoLatitude", { nullable: true }),
    longitude: t.exposeString("geoLongitude", { nullable: true }),
    address: t.exposeString("address", { nullable: true }),
    bannerImageSanityRef: t.exposeString("bannerImageSanityRef", {
      nullable: true,
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
    speakers: t.field({
      type: [SpeakerRef],
      resolve: async (root, args, ctx) => {
        const speakers = await speakersFetcher.searchSpeakers({
          DB: ctx.DB,
          search: { eventIds: [root.id] },
        });

        return speakers.map((s) => selectSpeakerSchema.parse(s));
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
      args: {
        input: t.arg({
          type: EventsTicketTemplateSearchInput,
          required: false,
        }),
      },
      resolve: async (root, { input }, { DB, USER }) => {
        const wheres: SQL[] = [];

        wheres.push(eq(ticketsSchema.eventId, root.id));

        // If the user is an admin, they can see all tickets, otherwise, only
        // active tickets are shown.
        let statusCheck: (typeof ticketStatusEnum)[number][] = ["active"];
        let visibilityCheck: (typeof ticketVisibilityEnum)[number][] = [
          "public",
        ];

        if (USER) {
          if (USER.isSuperAdmin) {
            statusCheck = ["active", "inactive"];

            visibilityCheck = ["public", "private", "unlisted"];
          } else {
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
                statusCheck = ["active", "inactive"];

                visibilityCheck = ["public", "private", "unlisted"];
              }
            }
          }
        }

        const tickets = await ticketsFetcher.searchTickets({
          DB,
          search: {
            status: statusCheck,
            visibility: visibilityCheck,
            eventIds: [root.id],
            tags: input?.tags ? input.tags : undefined,
          },
          sort: [["createdAt", "asc"]],
        });

        return tickets.map((t) => selectTicketSchema.parse(t));
      },
    }),
    schedules: t.field({
      type: [ScheduleRef],
      resolve: async (root, args, ctx) => {
        const schedules = await schedulesFetcher.searchSchedules({
          DB: ctx.DB,
          search: {
            eventIds: [root.id],
          },
        });

        return schedules.map((s) => selectScheduleSchema.parse(s));
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
        const { paymentStatus, redemptionStatus } = input ?? {};

        // TODO: (Felipe) Agregar:
        // No filtrar por user_id para admins de la comunidad / superadmins.
        // Permitir otros approvalStatus para los admin de la comunidad / superadmins.

        if (!USER) {
          return [];
        }

        const tickets = await userTicketFetcher.searchUserTickets({
          DB,
          search: {
            eventIds: [root.id],
            userIds: [USER.id],
            paymentStatus: paymentStatus ? [paymentStatus] : undefined,
            approvalStatus: ["approved", "not_required"],
            redemptionStatus: redemptionStatus ? [redemptionStatus] : undefined,
          },
        });

        return tickets.map((t) => selectUserTicketsSchema.parse(t));
      },
    }),
  }),
});
