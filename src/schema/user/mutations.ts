import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  PronounsEnum,
  selectUsersSchema,
  updateUsersSchema,
  usersSchema,
  usersToCommunitiesSchema,
} from "~/datasources/db/schema";
import { UserRef } from "~/schema/shared/refs";
import { pronounsEnum } from "~/schema/user/types";
import {
  UserRoleCommunity,
  canUpdateUserRoleInCommunity,
  isSameUser,
} from "~/validations";

const userEditInput = builder.inputType("userEditInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ required: false }),
    lastName: t.string({ required: false }),
    bio: t.string({ required: false }),
    pronouns: t.field({ type: pronounsEnum, required: false }),
  }),
});

builder.mutationField("updateUser", (t) =>
  t.field({
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
        const { id, name, lastName, bio, pronouns } = input;

        if (!ctx.USER) {
          throw new Error("User not found");
        }

        if (!isSameUser(id, ctx.USER.id)) {
          throw new Error("Not authorized");
        }

        const updateFields = {} as {
          name?: string;
          lastName?: string;
          bio?: string;
          pronouns?: PronounsEnum;
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

        if (pronouns) {
          updateFields.pronouns = pronouns;
        }

        const userData = updateUsersSchema.parse(updateFields);
        const user = (
          await ctx.DB.update(usersSchema)
            .set(userData)
            .where(eq(usersSchema.id, id))
            .returning()
        )?.[0];

        return selectUsersSchema.parse(user);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
);

const updateUserRoleInCommunityInput = builder.inputType(
  "updateUserRoleInCommunityInput",
  {
    fields: (t) => ({
      userId: t.string({ required: true }),
      communityId: t.string({ required: true }),
      role: t.string({ required: true }),
    }),
  },
);

builder.mutationField("updateUserRoleInCommunity", (t) =>
  t.field({
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
        const { userId, communityId, role } = input;

        if (!ctx.USER) {
          throw new Error("User not found");
        }

        if (
          !(await canUpdateUserRoleInCommunity(
            ctx.USER?.id,
            communityId,
            ctx.DB,
          ))
        ) {
          throw new Error("Not authorized");
        }

        await ctx.DB.update(usersToCommunitiesSchema)
          .set({
            role: role as UserRoleCommunity,
          })
          .where(eq(usersToCommunitiesSchema.userId, userId));

        const user = await ctx.DB.query.usersSchema.findFirst({
          where: (u, { eq }) => eq(u.id, userId),
        });

        return selectUsersSchema.parse(user);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
);
