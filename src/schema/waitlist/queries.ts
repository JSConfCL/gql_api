import { builder } from "~/builder";
import {
  selectTicketSchema
} from "~/datasources/db/schema";
import { applicationError, ServiceErrors } from "~/errors";
import { WaitlistRef } from "~/schema/shared/refs";
import { ticketsFetcher } from "~/schema/ticket/ticketsFetcher";

builder.queryField("getWaitlist", (t) =>
  t.field({
    description: "Get a single waitlist",
    type: WaitlistRef,
    args: {
      ticketId: t.arg.string({ required: true }),
    },
    authz: {
      rules: ["IsSuperAdmin"],
    },
    resolve: async (root, { ticketId }, { DB, USER, logger }) => {
      if (!USER) {
        throw new Error("User not found");
      }

      const tickets = await ticketsFetcher.searchTickets({
        DB,
        search: {
          ticketIds: [ticketId],
          tags: ["waitlist"],
        },
      });

      const ticket = tickets[0];

      if (!ticket) {
        throw applicationError(
          "Could not find a waitlist for the given ticketId",
          ServiceErrors.NOT_FOUND,
          logger,
        );
      }

      return selectTicketSchema.parse(ticket);
    },
  }),
);
