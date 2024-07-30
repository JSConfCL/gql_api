import slugify from "slugify";

import { builder } from "~/builder";
import { TagRef } from "~/schema/shared/refs";

builder.objectType(TagRef, {
  description:
    "Representation of a tag. Tags can be associated to many things. An event, a community, etc.",
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    slug: t.field({
      type: "String",
      resolve: (root) =>
        slugify(root.name.toLowerCase(), {
          strict: true,
        }),
    }),
    description: t.exposeString("description", { nullable: true }),
  }),
});
