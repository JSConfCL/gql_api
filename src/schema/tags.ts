import { TagRef } from "~/schema/refs";
import { selectTagsSchema, selectUsersSchema } from "~/datasources/db/schema";
import { builder } from "~/builder";

builder.objectType(TagRef, {
  description:
    "Representation of a tag. Tags can be associated to many things. An event, a community, etc.",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    slug: t.field({
      type: "String",
      resolve: (root) => root.name.toLowerCase().replace(" ", "-"),
    }),
    description: t.exposeString("description", { nullable: true }),
  }),
});

const TagSearchInput = builder.inputType("TagSearchInput", {
  fields: (t) => ({
    id: t.string({ required: false }),
    name: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});

builder.queryFields((t) => ({
  tags: t.field({
    description: "Get a list of users",
    type: [TagRef],
    args: {
      input: t.arg({ type: TagSearchInput, required: false }),
    },
    resolve: async (root, args, ctx) => {
      const users = await ctx.DB.query.tagsSchema.findMany({
        orderBy(fields, operators) {
          return operators.desc(fields.createdAt);
        },
      });
      return users.map((u) => selectTagsSchema.parse(u));
    },
  }),
}));
