import { builder } from "~/builder";
import { selectUserTicketsSchema } from "~/datasources/db/schema";
import { UserTicketRef, WaitlistRef } from "~/schema/shared/refs";
import { TicketLoadable } from "~/schema/ticket/types";
import { userTicketFetcher } from "~/schema/userTickets/userTicketFetcher";

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

        const tickets = await userTicketFetcher.searchUserTickets({
          DB: ctx.DB,
          search: {
            ticketIds: [root.id],
            eventIds: [root.eventId],
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
