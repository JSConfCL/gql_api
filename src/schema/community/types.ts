import { builder } from "~/builder";
import { selectEventsSchema, selectUsersSchema } from "~/datasources/db/schema";
import { eventsFetcher } from "~/schema/events/eventsFetcher";
import { CommunityRef, EventRef, UserRef } from "~/schema/shared/refs";

export const communityStatus = ["active", "inactive"] as const;
export const CommnunityStatus = builder.enumType("CommnunityStatus", {
  values: communityStatus,
});

builder.objectType(CommunityRef, {
  description: "Representation of a Community",
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
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
        const events = await eventsFetcher.searchEvents({
          DB: ctx.DB,
          search: {
            communityIds: [root.id],
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
