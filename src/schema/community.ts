import { builder } from "../builder";
import {
  communitySchema,
  selectCommunitySchema,
  selectUsersSchema,
  usersSchema,
} from "~/datasources/db/schema";
import { z } from "zod";
import { UserRef } from "~/schema/user";
import { _ } from "drizzle-orm/select.types.d-b947a018";
import { eq, like } from "drizzle-orm";

type CommunityGraphqlSchema = z.infer<typeof selectCommunitySchema>;
const CommunityRef = builder.objectRef<CommunityGraphqlSchema>("Community");

builder.objectType(CommunityRef, {
  description: "Representation of a Community",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    description: t.exposeString("description", { nullable: true }),
    status: t.exposeString("status", { nullable: false }),
    users: t.field({
      type: [UserRef],
      resolve: async (root, args, ctx) => {
        console.log("Representation of a Community", { root });
        const communities = await ctx.DB.select().from(usersSchema).all();
        return communities.map((u) => selectUsersSchema.parse(u));
      },
    }),
  }),
});

const CommnunityStatus = builder.enumType("CommnunityStatus", {
  values: ["active", "inactive"] as const,
});

builder.queryFields((t) => ({
  communities: t.field({
    type: [CommunityRef],
    resolve: async (root, args, ctx) => {
      console.log("Bunch of communities", { root });
      const communities = await ctx.DB.select().from(communitySchema).all();
      return communities.map((u) => selectCommunitySchema.parse(u));
    },
  }),
  community: t.field({
    type: CommunityRef,
    nullable: true,
    args: {
      id: t.arg.string({ required: false }),
      name: t.arg.string({ required: false }),
      status: t.arg({
        type: CommnunityStatus,
        required: false,
      }),
    },
    resolve: async (root, args, ctx) => {
      console.log("One single community fields", { root });
      const { id, name, status } = args;
      if (id || name || status) {
        let query = ctx.DB.select().from(communitySchema);
        if (id) {
          query = query.where(eq(communitySchema.id, id));
        }
        if (name) {
          query = query.where(like(communitySchema.name, name));
        }
        if (status) {
          query = query.where(eq(communitySchema.status, status));
        }
        const community = await query.get();
        if (!community) {
          return null;
        }
        return selectCommunitySchema.parse(community);
      }
      return null;
    },
  }),
}));
