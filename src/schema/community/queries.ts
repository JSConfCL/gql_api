import { builder } from "~/builder";
import { selectCommunitySchema } from "~/datasources/db/schema";
import { communitysFetcher } from "~/schema/community/communityFetcher";
import { CommunityRef } from "~/schema/shared/refs";

import { CommnunityStatus } from "./types";

builder.queryFields((t) => ({
  communities: t.field({
    description: "Get a list of communities. Filter by name, id, or status",
    type: [CommunityRef],
    // authz: {
    //   rules: ["IsAuthenticated"],
    // },
    args: {
      id: t.arg.string({ required: false }),
      name: t.arg.string({ required: false }),
      status: t.arg({
        type: CommnunityStatus,
        required: false,
      }),
    },
    resolve: async (root, args, ctx) => {
      const { id, name, status } = args;

      const communities = await communitysFetcher.searchCommunities({
        DB: ctx.DB,
        search: {
          communityIds: id ? [id] : undefined,
          communityName: name ?? undefined,
          communityStatus: status ? [status] : undefined,
        },
      });

      return communities.map((u) => selectCommunitySchema.parse(u));
    },
  }),
  community: t.field({
    description: "Get a community by id",
    type: CommunityRef,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      const { id } = args;
      const communities = await communitysFetcher.searchCommunities({
        DB: ctx.DB,
        search: {
          communityIds: id ? [id] : undefined,
        },
      });

      const commmunity = communities[0];

      return commmunity ? selectCommunitySchema.parse(commmunity) : null;
    },
  }),
}));
