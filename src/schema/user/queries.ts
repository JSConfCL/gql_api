import { builder } from "~/builder";
import { selectUsersSchema } from "~workers/db_service/db/schema";
import {
  createPaginationInputType,
  createPaginationObjectType,
} from "~/schema/pagination/types";
import { UserRef } from "~/schema/shared/refs";
import { SearchableUserTags } from "~/schema/user/types";
import { usersFetcher } from "~/schema/user/userFetcher";

const UserSearchValues = builder.inputType("UserSearchValues", {
  fields: (t) => ({
    name: t.field({
      type: "String",
      required: false,
    }),
    tags: t.field({
      type: [SearchableUserTags],
      required: false,
    }),
    userName: t.field({
      type: "String",
      required: false,
    }),
  }),
});

const PaginatedUsersRef = createPaginationObjectType(UserRef);

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
    type: PaginatedUsersRef,
    authz: {
      rules: ["IsSuperAdmin"],
    },
    args: createPaginationInputType(t, UserSearchValues),
    resolve: async (root, { input }, { DB }) => {
      const { name, tags } = input.search ?? {};

      const { data, pagination } = await usersFetcher.searchPaginatedUsers({
        DB,
        search: {
          name: name ?? undefined,
          tags: tags ?? undefined,
        },
        pagination: input.pagination,
      });

      const results = data.map((t) => selectUsersSchema.parse(t));

      return {
        data: results,
        pagination,
      };
    },
  }),
}));
