import { CommunityRef, UserRef } from "~/schema/shared/refs";
import {
  selectCommunitySchema,
  selectUsersSchema,
  usersSchema,
} from "~/datasources/db/schema";
import { builder } from "~/builder";
import { eq } from "drizzle-orm";

builder.objectType(UserRef, {
  description: "Representation of a user",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    lastName: t.exposeString("lastName", { nullable: true }),
    bio: t.exposeString("bio", { nullable: true }),
    username: t.exposeString("username", { nullable: true }),
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
            return operators.desc(fields.createdAt);
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

builder.queryFields((t) => ({
  users: t.field({
    description: "Get a list of users",
    type: [UserRef],
    resolve: async (root, args, ctx) => {
      const users = await ctx.DB.query.usersSchema.findMany({
        orderBy(fields, operators) {
          return operators.desc(fields.createdAt);
        },
      });
      return users.map((u) => selectUsersSchema.parse(u));
    },
  }),
}));

const userEditInput = builder.inputType("userEditInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ required: false }),
    lastName: t.string({ required: false }),
    bio: t.string({ required: false }),
    username: t.string({ required: false }),
  }),
});

builder.mutationFields((t) => ({
  updateUser: t.field({
    description: "Update a user",
    type: UserRef,
    nullable: false,
    authz: {
      rules: ["IsSameUser"],
    },
    args: {
      input: t.arg({ type: userEditInput, required: true }),
    },
    resolve: async (root, { input }, ctx) => {
      const { id, name, lastName, bio, username } = input;
      const user = await ctx.DB.update(usersSchema).set({ id, name, lastName, bio, username }).where(eq(usersSchema.id, id)).returning().get();
      return selectUsersSchema.parse(user);
    },
  }),
}));
