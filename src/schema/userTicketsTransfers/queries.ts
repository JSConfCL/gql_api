import { and, eq, getTableColumns, inArray, or } from "drizzle-orm";

import { builder } from "~/builder";
import { userTicketsSchema } from "~/datasources/db/userTickets";
import { userTicketTransfersSchema } from "~/datasources/db/userTicketsTransfers";
import { UserTicketTransferRef } from "~/schema/shared/refs";

import { ACCESSIBLE_USER_TICKET_APPROVAL_STATUSES } from "../userTickets/constants";

const SearchTicketTransferTypeEnum = builder.enumType("TicketTransferType", {
  values: ["SENT", "RECEIVED", "ALL"] as const,
});

builder.queryFields((t) => ({
  myTicketTransfers: t.field({
    description:
      "Get a list of user ticket transfers sent or received by the current user",
    type: [UserTicketTransferRef],
    args: {
      type: t.arg({
        type: SearchTicketTransferTypeEnum,
        defaultValue: "ALL",
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, args, { DB, USER }) => {
      if (!USER) {
        throw new Error("User not found");
      }

      let transferTypeWheres;

      if (args.type === "SENT") {
        transferTypeWheres = eq(
          userTicketTransfersSchema.senderUserId,
          USER.id,
        );
      } else if (args.type === "RECEIVED") {
        transferTypeWheres = eq(
          userTicketTransfersSchema.recipientUserId,
          USER.id,
        );
      } else if (args.type === "ALL") {
        transferTypeWheres = or(
          eq(userTicketTransfersSchema.senderUserId, USER.id),
          eq(userTicketTransfersSchema.recipientUserId, USER.id),
        );
      }

      const results = await DB.select({
        ...getTableColumns(userTicketTransfersSchema),
      })
        .from(userTicketTransfersSchema)
        .innerJoin(
          userTicketsSchema,
          and(
            eq(userTicketTransfersSchema.userTicketId, userTicketsSchema.id),
            // we ensure that the user cannot see tickets that where rejected
            // or are pending of payment for example
            inArray(
              userTicketsSchema.approvalStatus,
              ACCESSIBLE_USER_TICKET_APPROVAL_STATUSES,
            ),
            transferTypeWheres,
          ),
        );

      return results;
    },
  }),
}));
