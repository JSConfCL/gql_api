import {
  communitySchema,
  selectCommunitySchema,
  selectEventsSchema,
  selectUsersSchema,
} from "~/datasources/db/schema";
import { SQL, eq, like } from "drizzle-orm";
import { CommunityRef, EventRef, UserRef } from "~/schema/shared/refs";
import { builder } from "~/builder";

export const CommnunityStatus = builder.enumType("CommnunityStatus", {
  values: ["active", "inactive"] as const,
});

builder.objectType(CommunityRef, {
  description: "Representation of a Community",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    description: t.exposeString("description", { nullable: true }),
    status: t.field({
      type: CommnunityStatus,
      nullable: false,
      resolve: (root) => root.status,
    }),
    events: t.field({
      type: [EventRef],
      resolve: async (root, args, ctx) => {
        const events = await ctx.DB.query.eventsSchema.findMany({
          with: {
            eventsToCommunities: {
              where: (etc, { eq }) => eq(etc.communityId, root.id),
            },
          },
          orderBy(fields, operators) {
            return operators.desc(fields.createdAt);
          },
        });
        return events.map((e) => selectEventsSchema.parse(e));
      },
    }),
    users: t.field({
      type: [UserRef],
      resolve: async (root, args, ctx) => {
        const communities = await ctx.DB.query.communitySchema.findFirst({
          where: (c, { eq }) => eq(c.id, root.id),
          with: {
            usersToCommunities: {
              with: {
                user: true,
              },
            },
          },
          orderBy(fields, operators) {
            return operators.desc(fields.createdAt);
          },
        });
        if (!communities?.usersToCommunities) {
          return [];
        }
        return communities?.usersToCommunities?.map(({ user }) =>
          selectUsersSchema.parse(user),
        );
      },
    }),
  }),
});

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
        const sanitizedName = name.replace(/[%_]/g, "\\$&");
        const searchName = `%${sanitizedName}%`;
        wheres.push(like(communitySchema.name, searchName));
      }
      if (status) {
        wheres.push(eq(communitySchema.status, status));
      }
      const communities = await ctx.DB.query.communitySchema.findMany({
        where: (c, { and }) => and(...wheres),
        orderBy(fields, operators) {
          return operators.desc(fields.createdAt);
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
      if (!id) {
        return null;
      }
      const community = await ctx.DB.query.communitySchema.findFirst({
        where: (c, { eq }) => eq(c.id, id),
        orderBy(fields, operators) {
          return operators.desc(fields.createdAt);
        },
      });
      if (!community) {
        return null;
      }
      return selectCommunitySchema.parse(community);
    },
  }),
}));
