import { CommunityRef, UserRef } from "~/schema/refs";
import {
  selectCommunitySchema,
  selectUsersSchema,
} from "~/datasources/db/schema";
import { builder } from "~/builder";

builder.objectType(UserRef, {
  description: "Representation of a user",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    email: t.exposeString("email", { nullable: true }),
    username: t.exposeString("username", { nullable: false }),
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
        });
        if (!communities?.usersToCommunities) {
          return [];
        }
        return communities.usersToCommunities.map(({ community }) =>
          selectCommunitySchema.parse(community),
        );
      },
    }),
  }),
});

builder.queryFields((t) => ({
  users: t.field({
    description: "Get a list of users",
    type: [UserRef],
    resolve: async (root, args, ctx) => {
      const users = await ctx.DB.query.usersSchema.findMany();
      return users.map((u) => selectUsersSchema.parse(u));
    },
  }),
}));
