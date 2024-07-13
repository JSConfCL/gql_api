import { SQL, eq, ilike } from "drizzle-orm";

import { builder } from "~/builder";
import {
  communitySchema,
  selectCommunitySchema,
} from "~/datasources/db/schema";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";
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
      const wheres: SQL[] = [];

      if (id) {
        wheres.push(eq(communitySchema.id, id));
      }

      if (name) {
        wheres.push(ilike(communitySchema.name, sanitizeForLikeSearch(name)));
      }

      if (status) {
        wheres.push(eq(communitySchema.status, status));
      }

      const communities = await ctx.DB.query.communitySchema.findMany({
        where: (c, { and }) => and(...wheres),
        orderBy(fields, operators) {
          return operators.asc(fields.createdAt);
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
      const community = await ctx.DB.query.communitySchema.findFirst({
        where: (c, { eq }) => eq(c.id, id),
        orderBy(fields, operators) {
          return operators.asc(fields.createdAt);
        },
      });

      if (!community) {
        return null;
      }

      return selectCommunitySchema.parse(community);
    },
  }),
}));
