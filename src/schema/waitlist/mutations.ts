import { builder } from "~/builder";
import { sendAddedToWaitlistEmail } from "~/notifications/tickets";
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
      rules: ["IsAuthenticated"],
    },
    resolve: async (
      root,
      { ticketId },
      { DB, USER, logger, RPC_SERVICE_EMAIL },
    ) => {
      if (!USER) {
        throw new Error("User not found");
      }

      const insertedUserTicket = await createWaitlistEntry({
        DB,
        userId: USER.id,
        ticketId,
        logger,
      });

      await sendAddedToWaitlistEmail({
        DB,
        logger,
        RPC_SERVICE_EMAIL,
        userId: USER.id,
        userTicketId: insertedUserTicket.id,
      });

      return insertedUserTicket;
    },
  }),
);
