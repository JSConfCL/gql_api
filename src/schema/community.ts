import {
  communitySchema,
  eventsSchema,
  eventsToCommunitiesSchema,
  insertCommunitySchema,
  selectCommunitySchema,
  selectEventsSchema,
  selectUsersSchema,
} from "~/datasources/db/schema";
import { SQL, eq, inArray, like } from "drizzle-orm";
import { CommunityRef, EventRef, UserRef } from "~/schema/shared/refs";
import { builder } from "~/builder";
import { canCreateCommunity, canEditCommunity } from "~/validations";
import { v4 } from "uuid";
import { GraphQLError } from "graphql";

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

const CreateCommunityInput = builder.inputType("CreateCommunityInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    slug: t.string({ required: true }),
    description: t.string({ required: true }),
  }),
});
const UpdateCommunityInput = builder.inputType("UpdateCommunityInput", {
  fields: (t) => ({
    communityId: t.string({ required: true }),
    status: t.field({
      type: CommnunityStatus,
      required: false,
    }),
    name: t.string({ required: false }),
    slug: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});
builder.mutationFields((t) => ({
  createCommunity: t.field({
    description: "Create an community",
    type: CommunityRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: CreateCommunityInput, required: true }),
    },
    resolve: async (root, { input }, { USER, DB }) => {
      try {
        const { name, slug, description } = input;
        if (!USER) {
          throw new Error("User not found");
        }
        if (!canCreateCommunity(USER)) {
          throw new Error("FORBIDDEN");
        }
        const existSlug = await DB.query.communitySchema.findFirst({
          where: (c, { eq }) => eq(c.slug, input.slug),
        });
        if (existSlug) {
          throw new Error("This slug already exist");
        }
        const id = v4();
        const newCommunity = insertCommunitySchema.parse({
          id,
          name,
          slug,
          description,
        });

        const communities = await DB.insert(communitySchema)
          .values(newCommunity)
          .returning();

        return selectCommunitySchema.parse(communities);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
  editCommunity: t.field({
    description: "Edit an community",
    type: CommunityRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: UpdateCommunityInput, required: true }),
    },
    resolve: async (root, { input }, { USER, DB }) => {
      try {
        const { communityId, status, description, name, slug } = input;
        if (!USER) {
          throw new Error("User not found");
        }
        if (!(await canEditCommunity(USER, communityId, DB))) {
          throw new Error("FORBIDDEN");
        }
        const dataToUpdate: Record<string, string | null | undefined> = {};

        const foundCommunity = await DB.query.communitySchema.findFirst({
          where: (c, { eq }) => eq(c.id, communityId),
        });

        if (!foundCommunity) {
          throw new Error("Community not found");
        }
        if (status) {
          dataToUpdate.status = status;
        }
        if (description) {
          dataToUpdate.description = description;
        }
        if (name) {
          dataToUpdate.name = name;
        }
        if (slug) {
          dataToUpdate.slug = slug;
        }
        const community = await DB.update(communitySchema)
          .set(dataToUpdate)
          .where(eq(communitySchema.id, communityId))
          .returning();

        return selectCommunitySchema.parse(community);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
}));
