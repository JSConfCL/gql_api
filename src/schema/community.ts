import { builder } from "../builder";
import {
  communitySchema,
  selectCommunitySchema,
  selectUsersSchema,
  usersSchema,
} from "~/datasources/db/schema";
import { z } from "zod";
import { UserRef } from "~/schema/user";
import { SQL, eq, like, and } from "drizzle-orm";

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
    description: "Get a list of communities. Filter by name, id, or status",
    type: [CommunityRef],
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
        const sanitizedName = name.replace(/[%_]/g, "\\$&");
        const searchName = `%${sanitizedName}%`;
        wheres.push(like(communitySchema.name, searchName));
      }
      if (status) {
        wheres.push(eq(communitySchema.status, status));
      }
      const communities = await ctx.DB.select()
        .from(communitySchema)
        .where(and(...wheres))
        .all();
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
      if (!id) {
        return null;
      }
      const community = await ctx.DB.select()
        .from(communitySchema)
        .where(eq(communitySchema.id, id))
        .get();
      if (!community) {
        return null;
      }
      return selectCommunitySchema.parse(community);
    },
  }),
}));
