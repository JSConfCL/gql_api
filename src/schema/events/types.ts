import { SQL, eq, inArray } from "drizzle-orm";

import { authHelpers } from "~/authz/helpers";
import { builder } from "~/builder";
import {
  ScheduleStatus,
  selectCommunitySchema,
  selectGalleriesSchema,
  selectImagesSchema,
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
import { GalleryRef } from "~/schema/gallery/types";
import { ImageRef } from "~/schema/image/types";
import { schedulesFetcher } from "~/schema/schedules/schedulesFetcher";
import { ScheduleRef } from "~/schema/schedules/types";
import {
  CommunityRef,
  EventRef,
  PublicEventAttendanceRef,
  PublicUserInfoRef,
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
import { UserLoadable } from "~/schema/user/types";
import { ACCESSIBLE_USER_TICKET_APPROVAL_STATUSES } from "~/schema/userTickets/constants";
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
  load: async (ids: string[], context) => {
    const result = await eventsFetcher.searchEvents({
      DB: context.DB,
      search: { eventIds: ids },
      sort: null,
    });

    const resultByIdMap = new Map(result.map((item) => [item.id, item]));

    return ids.map(
      (id) => resultByIdMap.get(id) || new Error(`Event ${id} not found`),
    );
  },
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
    galleries: t.field({
      type: [GalleryRef],
      resolve: async ({ id }, args, ctx) => {
        const galleries = await ctx.DB.query.galleriesSchema.findMany({
          where: (g, { eq }) => eq(g.eventId, id),
        });

        return galleries.map((g) => selectGalleriesSchema.parse(g));
      },
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
    logoImage: t.field({
      type: ImageRef,
      nullable: true,
      resolve: async ({ logoImage }, args, { DB }) => {
        if (!logoImage) {
          return null;
        }

        const image = await DB.query.imagesSchema.findFirst({
          where: (i, { eq }) => eq(i.id, logoImage),
        });

        if (!image) {
          return null;
        }

        return selectImagesSchema.parse(image);
      },
    }),
    previewImage: t.field({
      type: ImageRef,
      nullable: true,
      resolve: async ({ previewImage }, args, { DB }) => {
        if (!previewImage) {
          return null;
        }

        const image = await DB.query.imagesSchema.findFirst({
          where: (i, { eq }) => eq(i.id, previewImage),
        });

        if (!image) {
          return null;
        }

        return selectImagesSchema.parse(image);
      },
    }),
    bannerImage: t.field({
      type: ImageRef,
      nullable: true,
      resolve: async ({ bannerImage }, args, { DB }) => {
        if (!bannerImage) {
          return null;
        }

        const image = await DB.query.imagesSchema.findFirst({
          where: (i, { eq }) => eq(i.id, bannerImage),
        });

        if (!image) {
          return null;
        }

        return selectImagesSchema.parse(image);
      },
    }),
    mobileBannerImage: t.field({
      type: ImageRef,
      nullable: true,
      resolve: async ({ mobileBannerImage }, args, { DB }) => {
        if (!mobileBannerImage) {
          return null;
        }

        const image = await DB.query.imagesSchema.findFirst({
          where: (i, { eq }) => eq(i.id, mobileBannerImage),
        });

        if (!image) {
          return null;
        }

        return selectImagesSchema.parse(image);
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
    publicShareURL: t.exposeString("publicShareURL", { nullable: true }),
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
            const isAdmin = await authHelpers.isAdminOfEventCommunity({
              userId: USER.id,
              eventId: root.id,
              DB,
            });

            if (isAdmin) {
              statusCheck = ["active", "inactive"];

              visibilityCheck = ["public", "private", "unlisted"];
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
            satus: ScheduleStatus.active,
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
            approvalStatus: ACCESSIBLE_USER_TICKET_APPROVAL_STATUSES,
            redemptionStatus: redemptionStatus ? [redemptionStatus] : undefined,
          },
        });

        return tickets.map((t) => selectUserTicketsSchema.parse(t));
      },
    }),
  }),
});

export const PublicEventAttendanceInfo = builder.objectType(
  PublicEventAttendanceRef,
  {
    description:
      "Representation of the public data for a user's event attendance, used usually for public profiles or 'shareable ticket' pages",
    fields: (t) => ({
      id: t.exposeID("publicId", { nullable: false }),
      event: t.field({
        type: EventLoadable,
        resolve: (root) => root.event,
      }),
      userInfo: t.field({
        type: PublicUserInfoRef,
        nullable: false,
        resolve: async ({ user }, args, ctx) => {
          const foundUser = await UserLoadable.getDataloader(ctx).load(user.id);

          return foundUser;
        },
      }),
    }),
  },
);
