import { builder } from "~/builder";
import {
  AllowedUserTags,
  selectCommunitySchema,
  selectTeamsSchema,
  USER,
} from "~/datasources/db/schema";
import { CommunityRef, UserRef } from "~/schema/shared/refs";
import { TeamRef } from "~/schema/teams/types";
import { Context } from "~/types";

const isSuperAdminOrSelf = (root: USER, ctx: Context) => {
  return ctx.USER?.isSuperAdmin || ctx.USER?.id === root.id;
};

builder.objectType(UserRef, {
  description: "Representation of a user",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    username: t.exposeString("username", { nullable: false }),
    lastName: t.exposeString("lastName", { nullable: true }),
    bio: t.exposeString("bio", { nullable: true }),
    isSuperAdmin: t.exposeBoolean("isSuperAdmin", { nullable: true }),
    imageUrl: t.exposeString("imageUrl", { nullable: true }),
    email: t.field({
      type: "String",
      nullable: true,
      resolve: (root, args, ctx) => {
        if (isSuperAdminOrSelf(root, ctx)) {
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
  }),
});

export const SearchableUserTags = builder.enumType("SearchableUserTags", {
  values: Object.values(AllowedUserTags),
});
