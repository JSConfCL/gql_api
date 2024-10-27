import { eq, getTableColumns } from "drizzle-orm";

import { builder } from "~/builder";
import {
  addonsSchema,
  ticketAddonsSchema,
  ticketsSchema,
} from "~/datasources/db/schema";

import { AddonRef } from "./types";

builder.queryField("searchAddons", (t) =>
  t.field({
    description: "Get addons for a specific event",
    type: [AddonRef],
    args: {
      eventId: t.arg.string({ required: true }),
    },
    authz: {
      rules: ["IsSuperAdmin"],
    },
    resolve: async (root, { eventId }, { DB }) => {
      const addons = await DB.select({
        ...getTableColumns(addonsSchema),
      })
        .from(addonsSchema)
        .innerJoin(
          ticketAddonsSchema,
          eq(ticketAddonsSchema.addonId, addonsSchema.id),
        )
        .innerJoin(
          ticketsSchema,
          eq(ticketsSchema.id, ticketAddonsSchema.ticketId),
        )
        .where(eq(ticketsSchema.eventId, eventId));

      return addons;
    },
  }),
);
