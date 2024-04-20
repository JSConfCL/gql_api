import { eq, inArray } from "drizzle-orm";

import { builder } from "~/builder";
import {
  eventsSchema,
  eventsToCommunitiesSchema,
  selectEventsSchema,
  selectUsersSchema,
} from "~/datasources/db/schema";
import { CommunityRef, EventRef, UserRef } from "~/schema/shared/refs";

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
          where: inArray(
            eventsSchema.id,
            ctx.DB.select({ id: eventsToCommunitiesSchema.eventId })
              .from(eventsToCommunitiesSchema)
              .where(eq(eventsToCommunitiesSchema.communityId, root.id)),
          ),
          orderBy(fields, operators) {
            return operators.asc(fields.createdAt);
          },
        });

        return events.map((e) => selectEventsSchema.parse(e));
      },
    }),
    logo: t.field({
      type: "String",
      nullable: true,
      resolve: (root) => root.logoImageSanityRef,
    }),
    banner: t.field({
      type: "String",
      nullable: true,
      resolve: (root) => root.bannerImageSanityRef,
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
            return operators.asc(fields.createdAt);
          },
        });
        if (
          !communities?.usersToCommunities ||
          communities?.usersToCommunities?.length === 0
        ) {
          return [];
        }
        return communities?.usersToCommunities?.map(({ user }) =>
          selectUsersSchema.parse(user),
        );
      },
    }),
  }),
});
