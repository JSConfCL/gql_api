import { areUsersOnSameTeam, isSuperAdminOrSelf } from "~/authz/helpers";
import { builder } from "~/builder";
import {
  AllowedUserTags,
  PronounsEnum,
  selectCommunitySchema,
  selectTeamsSchema,
  selectUsersSchema,
  selectUserTicketsSchema,
} from "~/datasources/db/schema";
import {
  CommunityRef,
  PublicUserInfoRef,
  UserDataRef,
  UserRef,
  UserTicketRef,
} from "~/schema/shared/refs";
import { TeamRef } from "~/schema/teams/types";
import { usersFetcher } from "~/schema/user/userFetcher";
import { userTicketFetcher } from "~/schema/userTickets/userTicketFetcher";

import { ACCESSIBLE_USER_TICKET_APPROVAL_STATUSES } from "../userTickets/constants";

export const pronounsEnum = builder.enumType(PronounsEnum, {
  name: "PronounsEnum",
});

const RSVPFilterInput = builder.inputType("RSVPFilterInput", {
  fields: (t) => ({
    eventIds: t.stringList({
      required: false,
    }),
  }),
});

export const UserLoadable = builder.loadableObject(UserRef, {
  description: "Representation of a user",
  load: async (ids: string[], { DB }) => {
    const result = await usersFetcher.searchUsers({
      DB,
      search: { userIds: ids },
      sort: null,
    });

    const resultByIdMap = new Map(
      result.map((item) => [item.id, selectUsersSchema.parse(item)]),
    );

    return ids.map(
      (id) => resultByIdMap.get(id) || new Error(`Speaker ${id} not found`),
    );
  },
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    username: t.exposeString("username", { nullable: false }),
    lastName: t.exposeString("lastName", { nullable: true }),
    bio: t.exposeString("bio", { nullable: true }),
    isSuperAdmin: t.exposeBoolean("isSuperAdmin", { nullable: true }),
    imageUrl: t.exposeString("imageUrl", { nullable: true }),
    pronouns: t.field({
      type: pronounsEnum,
      nullable: true,
      resolve: (root) => {
        return root.pronouns;
      },
    }),
    email: t.field({
      type: "String",
      nullable: true,
      resolve: async (root, args, ctx) => {
        if (isSuperAdminOrSelf(root, ctx)) {
          return root.email;
        }

        if (await areUsersOnSameTeam(root, ctx)) {
          return root.email;
        }
      },
    }),
    teams: t.field({
      type: [TeamRef],
      resolve: async (root, args, ctx) => {
        if (!isSuperAdminOrSelf(root, ctx)) {
          return [];
        }

        const teams = await ctx.DB.query.userTeamsSchema.findMany({
          where: (uts, { eq }) => eq(uts.userId, root.id),
          with: {
            team: true,
          },
        });

        if (!teams) {
          return [];
        }

        return teams.map((tu) => selectTeamsSchema.parse(tu.team));
      },
    }),
    impersonatedUser: t.field({
      type: UserRef,
      nullable: true,
      resolve: (root, args, ctx) => {
        if (ctx.ORIGINAL_USER?.isSuperAdmin) {
          return ctx.USER;
        }
      },
    }),
    rsvps: t.field({
      description: "Get a list of user's RSVPs",
      args: {
        input: t.arg({
          type: RSVPFilterInput,
          required: false,
        }),
      },
      type: [UserTicketRef],
      resolve: async (root, args, ctx) => {
        const canSeeTickets =
          ctx.USER?.isSuperAdmin || ctx.USER?.id === root.id;

        if (!canSeeTickets) {
          return [];
        }

        const { eventIds } = args.input || {};

        const userTickets = await userTicketFetcher.searchUserTickets({
          DB: ctx.DB,
          search: {
            eventIds: eventIds ?? undefined,
            userIds: [root.id],
            approvalStatus: ctx.USER?.isSuperAdmin
              ? undefined
              : ACCESSIBLE_USER_TICKET_APPROVAL_STATUSES,
          },
        });

        return userTickets.map((el) => selectUserTicketsSchema.parse(el));
      },
    }),
    communities: t.field({
      type: [CommunityRef],
      resolve: async (root, args, ctx) => {
        const communities = await ctx.DB.query.usersSchema.findFirst({
          where: (u, { eq }) => eq(u.id, root.id),
          with: {
            usersToCommunities: {
              with: {
                community: true,
              },
            },
          },
          orderBy(fields, operators) {
            return operators.asc(fields.createdAt);
          },
        });

        if (
          !communities?.usersToCommunities ||
          communities?.usersToCommunities.length === 0
        ) {
          return [];
        }

        return communities.usersToCommunities.map(({ community }) =>
          selectCommunitySchema.parse(community),
        );
      },
    }),
    userData: t.field({
      type: UserDataRef,
      nullable: true,
      authz: {
        rules: ["CanSeePersonalData"],
      },
      resolve: (root, args, ctx) => {
        return ctx.DB.query.userDataSchema.findFirst({
          where: (ud, { eq }) => eq(ud.userId, root.id),
        });
      },
    }),
  }),
});

export const SearchableUserTags = builder.enumType("SearchableUserTags", {
  values: Object.values(AllowedUserTags),
});

builder.objectType(UserDataRef, {
  description: "Representation of a user's data",
  fields: (t) => ({
    countryOfResidence: t.exposeString("countryOfResidence"),
    city: t.exposeString("city"),
    worksInOrganization: t.exposeBoolean("worksInOrganization"),
    organizationName: t.exposeString("organizationName", { nullable: true }),
    roleInOrganization: t.exposeString("roleInOrganization", {
      nullable: true,
    }),
    rut: t.exposeString("rut", {
      nullable: true,
    }),
    foodAllergies: t.exposeString("foodAllergies", { nullable: true }),
    emergencyPhoneNumber: t.exposeString("emergencyPhoneNumber", {
      nullable: true,
    }),
  }),
});

builder.objectType(PublicUserInfoRef, {
  description:
    "Representation of a user's publicly accessible data, to be used in public contexts like shareable ticket UIs",
  fields: (t) => ({
    userName: t.exposeString("username"),
    firstName: t.exposeString("name", {
      nullable: true,
    }),
    lastName: t.exposeString("lastName", {
      nullable: true,
    }),
    profilePicture: t.exposeString("imageUrl", {
      nullable: true,
    }),
  }),
});
