import { SQL, eq, ilike } from "drizzle-orm";

import { builder } from "~/builder";
import { selectTagsSchema, tagsSchema } from "~/datasources/db/schema";
import { logger } from "~/logging";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";
import { TagRef } from "~/schema/shared/refs";

const TagSearchInput = builder.inputType("TagSearchInput", {
  fields: (t) => ({
    id: t.string({ required: false }),
    name: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});

builder.queryFields((t) => ({
  tags: t.field({
    description: "Get a list of tags",
    type: [TagRef],
    args: {
      input: t.arg({ type: TagSearchInput, required: false }),
    },
    resolve: async (root, args, ctx) => {
      const { id, name, description } = args.input || {};
      const wheres: SQL[] = [];

      if (id) {
        wheres.push(eq(tagsSchema.id, id));
      }

      if (name) {
        wheres.push(ilike(tagsSchema.name, sanitizeForLikeSearch(name)));
      }

      if (description) {
        wheres.push(
          ilike(tagsSchema.description, sanitizeForLikeSearch(description)),
        );
      }

      const query = ctx.DB.query.tagsSchema.findMany({
        where: (c, { and }) => and(...wheres),
        orderBy(fields, operators) {
          return operators.asc(fields.createdAt);
        },
      });

      logger.debug("QUERY -> ", query.toSQL());
      const users = await query;

      return users.map((u) => selectTagsSchema.parse(u));
    },
  }),
}));
