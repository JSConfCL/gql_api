import { builder } from "~/builder";
import { selectUserTicketsSchema } from "~/datasources/db/schema";
import { UserTicketRef } from "~/schema/shared/refs";
import { createWaitlistEntry } from "~/schema/waitlist/helpers";

builder.mutationField("applyToWaitlist", (t) =>
  t.field({
    description: "Apply to a waitlist",
    type: UserTicketRef,
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

      const insertedUserTicket = await createWaitlistEntry({
        DB,
        userId: USER.id,
        ticketId,
        logger,
      });

      return selectUserTicketsSchema.parse(insertedUserTicket);
    },
  }),
);
