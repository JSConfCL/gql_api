import { builder } from "~/builder";

builder.queryFields((t) => ({
  status: t.string({
    args: {
      name: t.arg.string(),
    },
    resolve: (parent, { name }) => {
      return `Hello, ${name || ""}. We are up and running!`;
    },
  }),
}));
