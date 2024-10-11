import { builder } from "~/builder";
import { UserTicketTransferRef } from "~/schema/shared/refs";

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

      const results = await DB.query.userTicketTransfersSchema.findMany({
        where: (utg, { eq, or }) => {
          if (args.type === "ALL") {
            return or(
              eq(utg.senderUserId, USER.id),
              eq(utg.recipientUserId, USER.id),
            );
          }

          if (args.type === "SENT") {
            return eq(utg.senderUserId, USER.id);
          }

          if (args.type === "RECEIVED") {
            return eq(utg.recipientUserId, USER.id);
          }
        },
      });

      return results;
    },
  }),
}));
