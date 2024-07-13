import { SQL, inArray } from "drizzle-orm";

import { builder } from "~/builder";
import {
  AllowedUserTags,
  selectUsersSchema,
  tagsSchema,
} from "~/datasources/db/schema";
import { UserRef } from "~/schema/shared/refs";
import { SearchableUserTags } from "~/schema/user/types";

const userSearchInput = builder
  .inputRef<{
    name?: string;
    tags?: AllowedUserTags[];
  }>("userSearchInput")
  .implement({
    fields: (t) => ({
      tags: t.field({ type: [SearchableUserTags], required: false }),
    }),
  });

builder.queryFields((t) => ({
  me: t.field({
    description: "Get the current user",
    type: UserRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, args, { USER, DB }) => {
      if (!USER) {
        throw new Error("User not found");
      }

      const user = await DB.query.usersSchema.findFirst({
        where: (u, { eq }) => eq(u.id, USER.id),
      });

      return selectUsersSchema.parse(user);
    },
  }),
  users: t.field({
    description: "Get a list of users",
    type: [UserRef],
    resolve: async (root, args, ctx) => {
      const users = await ctx.DB.query.usersSchema.findMany({
        orderBy(fields, operators) {
          return operators.asc(fields.createdAt);
        },
      });

      return users.map((u) => selectUsersSchema.parse(u));
    },
  }),
  userSearch: t.field({
    description: "Get a list of users",
    type: [UserRef],
    authz: {
      rules: ["IsSuperAdmin"],
    },
    args: {
      input: t.arg({ type: userSearchInput, required: true }),
    },
    resolve: async (root, { input }, { DB }) => {
      const { tags } = input;
      const wheres: SQL[] = [];

      if (!tags || !tags.length) {
        return [];
      }

      if (tags && tags.length !== 0) {
        wheres.push(inArray(tagsSchema.name, tags));
      }

      const tagsUsers = await DB.query.tagsSchema.findMany({
        where: (_, { and }) => and(...wheres),
        with: {
          tagsToUsers: {
            with: {
              user: true,
            },
          },
        },
      });

      return tagsUsers.flatMap((tu) =>
        tu.tagsToUsers.map((tagsToUser) =>
          selectUsersSchema.parse(tagsToUser?.user),
        ),
      );
    },
  }),
}));
