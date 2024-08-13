import { builder } from "~/builder";
import { selectUserTicketsSchema } from "~/datasources/db/schema";
import { UserTicketRef, WaitlistRef } from "~/schema/shared/refs";
import { ticketsFetcher } from "~/schema/ticket/ticketsFetcher";
import { TicketLoadable } from "~/schema/ticket/types";

export const TicketTemplateStatus = builder.enumType("TicketTemplateStatus", {
  values: ["active", "inactive"] as const,
});

export const TicketTemplateVisibility = builder.enumType(
  "TicketTemplateVisibility",
  {
    values: ["public", "private", "unlisted"] as const,
  },
);

export const WaitlistApprovalStatus = builder.enumType(
  "WaitlistApprovalStatus",
  {
    values: ["approved", "pending", "rejected"] as const,
  },
);

builder.objectType(WaitlistRef, {
  description: "Representation of a waitlist",
  fields: (t) => ({
    id: t.exposeID("id", {
      description:
        "The ID of the waitlist. It matches the ID of the underlying ticket",
    }),
    ticket: t.field({
      type: TicketLoadable,
      resolve: (root) => root.id,
    }),
    myRsvp: t.field({
      type: UserTicketRef,
      nullable: true,
      resolve: async (root, args, ctx) => {
        const user = ctx.USER;

        if (!user) {
          return null;
        }

        const tickets = await ticketsFetcher.searchTickets({
          DB: ctx.DB,
          search: {
            ticketIds: [root.id],
            tags: ["waitlist"],
          },
        });

        const ticket = tickets[0];

        if (!ticket) {
          return null;
        }

        return selectUserTicketsSchema.parse(ticket);
      },
    }),
  }),
});
