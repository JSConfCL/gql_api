import { CommunityRef, NewRef } from "~/schema/shared/refs";
import { insertNewsSchema, newsSchema, newsToCommunitiesSchema, selectCommunitySchema, selectNewsSchema } from "~/datasources/db/schema";
import { builder } from "~/builder";
import slugify from "slugify";
import { SQL, eq, like } from "drizzle-orm";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";
import { v4 } from "uuid";

builder.objectType(NewRef, {
  description: "Representation of a new. News can be associated to a community",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    title: t.exposeString("title", { nullable: true }),
    description: t.exposeString("description", { nullable: true }),
    status: t.exposeString("status", { nullable: true }),
    community: t.field({
      type: CommunityRef,
      nullable: true,
      resolve: async (root, args, ctx) => {
        const community = await ctx.DB.query.communitySchema.findFirst({
          where: (n, { eq }) => eq(n.id, root.id),
          with: {
            newsToCommunities: {
              with: {
                community: true,
              },
            },
          },
        });
        if (!community) {
          return null;
        }
        return selectCommunitySchema.parse(community);
      },
    }),
  }),
});

const NewSearchInput = builder.inputType("NewSearchInput", {
  fields: (t) => ({
    id: t.string({ required: false }),
    title: t.string({ required: false }),
    description: t.string({ required: false }),
    status: t.string({ required: false, defaultValue: "inactive" }),
  }),
});

builder.queryFields((t) => ({
  news: t.field({
    description: "Get a list of new. Filter by title, id, status.",
    type: [NewRef],
    args: {
      input: t.arg({ type: NewSearchInput, required: false })
    },
    resolve: async (root, args, ctx) => {
      const { id, title, description, status } = args.input || {};
      const wheres: SQL[] = [];
      if (id) {
        wheres.push(eq(newsSchema.id, id));
      }
      if (title) {
        wheres.push(like(newsSchema.title, sanitizeForLikeSearch(title)));
      }
      if (description) {
        wheres.push(
          like(newsSchema.description, sanitizeForLikeSearch(description)),
        );
      }
      if (status) {
        wheres.push(like(newsSchema.status, sanitizeForLikeSearch(status)));
      }
      const news = await ctx.DB.query.newsSchema.findMany({
        where: (c, { and }) => and(...wheres),
        orderBy(fields, operators) {
          return operators.desc(fields.createdAt);
        },
      });

      return news.map((u) => selectNewsSchema.parse(u));
    },
  }),
}));

const newCreateInput = builder.inputType("NewCreateInput", {
  fields: (t) => ({
    title: t.string({ required: true }),
    description: t.string({ required: true }),
    status: t.string({ required: true }),
    communityId: t.string({ required: false }),
  }),
});

builder.mutationFields((t) => ({
  createNew: t.field({
    description: "Create a new",
    type: NewRef,
    nullable: false,
    authz: {
      compositeRules: [
        {
          or: ["CanCreateEvent", "IsSuperAdmin"],
        },
      ],
    },
    args: {
      input: t.arg({ type: newCreateInput, required: true }),
    },
    resolve: async (root, { input }, ctx) => {
      const {
        title,
        description,
        status,
        communityId,
      } = input;
      const result = await ctx.DB.transaction(async (trx) => {
        try {
          const id = v4();
          const newNew = insertNewsSchema.parse({
            id,
            title,
            description,
            status,
          });

          const news = await trx
            .insert(newsSchema)
            .values(newNew)
            .returning()
            .get();
          await trx
            .insert(newsToCommunitiesSchema)
            .values({
              newId: id,
              communityId: communityId,
            })
            .returning()
            .get();

          return news;
        } catch (e) {
          // trx.rollback();
        }
      });
      return selectNewsSchema.parse(result);
    },
  }),
}));

