import {
  CommunityRef,
  UserRef,
} from "~/schema/shared/refs";
import {
  selectCommunitySchema,
  selectUsersSchema,
  usersSchema,
  usersToCommunitiesSchema,
} from "~/datasources/db/schema";
import { builder } from "~/builder";
import { eq } from "drizzle-orm";
import {
  UserRoleCommunity,
  canUpdateUserRoleInCommunity,
  isSameUser,
} from "~/validations";
import { GraphQLError } from "graphql";

builder.objectType(UserRef, {
  description: "Representation of a user",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    username: t.exposeString("username", { nullable: false }),
    lastName: t.exposeString("lastName", { nullable: true }),
    bio: t.exposeString("bio", { nullable: true }),
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
const updateUserRoleInCommunityInput = builder.inputType(
  "updateUserRoleInCommunityInput",
  {
    fields: (t) => ({
      id: t.string({ required: true }),
      communityId: t.string({ required: true }),
      role: t.string({ required: true }),
    }),
  },
);
builder.mutationFields((t) => ({
  updateUser: t.field({
    description: "Update a user",
    type: UserRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: userEditInput, required: true }),
    },
    resolve: async (root, { input }, ctx) => {
      try {
        const { id, name, lastName, bio, username } = input;
        if (!ctx.USER) throw new Error("User not found");
        if (!isSameUser(id, ctx.USER.id)) throw new Error("Not authorized");
        const updateFields = {} as {
          name?: string;
          lastName?: string;
          bio?: string;
          username?: string;
        };

        if (name) {
          updateFields.name = name;
        }
        if (lastName) {
          updateFields.lastName = lastName;
        }
        if (bio) {
          updateFields.bio = bio;
        }
        if (username) {
          updateFields.username = username;
        }
        const user = await ctx.DB.update(usersSchema)
          .set(updateFields)
          .where(eq(usersSchema.id, id))
          .returning()
          .get();
        return selectUsersSchema.parse(user);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
  updateUserRoleInCommunity: t.field({
    description: "Update a user role",
    type: UserRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: updateUserRoleInCommunityInput, required: true }),
    },
    resolve: async (root, { input }, ctx) => {
      try {
        const { id, communityId, role } = input;
        if (!ctx.USER) throw new Error("User not found");
        if (
          !(await canUpdateUserRoleInCommunity(
            ctx.USER?.id,
            communityId,
            ctx.DB,
          ))
        )
          throw new Error("Not authorized");
        await ctx.DB.update(usersToCommunitiesSchema)
          .set({
            role: role as UserRoleCommunity,
          })
          .where(eq(usersToCommunitiesSchema.userId, id))

        const user = await ctx.DB.query.usersSchema.findFirst({
          where: (u, { eq }) => eq(u.id, id),
        });

        return selectUsersSchema.parse(user);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
}));
