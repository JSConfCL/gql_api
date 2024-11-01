import { eq } from "drizzle-orm";

import { builder } from "~/builder";
import { addonsSchema } from "~/datasources/db/schema";

import { AddonRef } from "./types";

builder.queryField("searchAddons", (t) =>
  t.field({
    description: "Get addons for a specific event",
    type: [AddonRef],
    args: {
      eventId: t.arg.string({ required: true }),
    },
    resolve: async (root, { eventId }, { DB }) => {
      const addons = await DB.query.addonsSchema.findMany({
        where: eq(addonsSchema.eventId, eventId),
      });

      return addons;
    },
  }),
);
