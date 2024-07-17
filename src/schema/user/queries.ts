import { SQL, inArray } from "drizzle-orm";

import { builder } from "~/builder";
import {
  AllowedUserTags,
  selectUsersSchema,
  tagsSchema,
} from "~/datasources/db/schema";
import { UserRef } from "~/schema/shared/refs";
import { SearchableUserTags } from "~/schema/user/types";
import { usersFetcher } from "~/schema/user/userFetcher";

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
    resolve: async (root, args, { ORIGINAL_USER, DB }) => {
      if (!ORIGINAL_USER) {
        throw new Error("User not found");
      }

      const users = await usersFetcher.searchUsers({
        DB: DB,
        search: {
          userIds: [ORIGINAL_USER.id],
        },
      });

      const user = users[0];

      if (!user) {
        throw new Error("User not found");
      }

      return selectUsersSchema.parse(user);
    },
  }),
  users: t.field({
    description: "Get a list of users",
    type: [UserRef],
    authz: {
      rules: ["IsSuperAdmin"],
    },
    resolve: async (root, args, { DB }) => {
      const users = await usersFetcher.searchUsers({
        DB: DB,
        search: {},
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
