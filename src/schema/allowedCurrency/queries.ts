import { builder } from "~/builder";

import { AllowedCurrencyRef } from "../shared/refs";

builder.queryField("searchCurrencies", (t) =>
  t.field({
    type: [AllowedCurrencyRef],
    authz: {
      rules: ["IsSuperAdmin"],
    },
    resolve: async (_root, _args, { DB }) => {
      const allowedCurrencies = await DB.query.allowedCurrencySchema.findMany();

      return allowedCurrencies;
    },
  }),
);
