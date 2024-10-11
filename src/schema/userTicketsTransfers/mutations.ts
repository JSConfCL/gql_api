import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  UserTicketTransferStatus,
  InsertUserTicketTransferSchema,
  userTicketTransfersSchema,
  userTicketsSchema,
  userTicketsApprovalStatusEnum,
} from "~/datasources/db/schema";
import { UserTicketTransferRef, UserTicketRef } from "~/schema/shared/refs";

import {
  getExpirationDateForTicketTransfer,
  getOrCreateTransferRecipients,
} from "./helpers";
import { cleanEmail } from "../user/userHelpers";

export const UserTicketTransferInfoInputRef = builder.inputType(
  "UserTicketTransferInfoInput",
  {
    fields: (t) => ({
      email: t.string({
        required: true,
      }),
      name: t.string({
        required: true,
      }),
      message: t.string({
        required: false,
      }),
    }),
  },
);

builder.mutationField("transferMyTicketToUser", (t) =>
  t.field({
    type: UserTicketTransferRef,
    args: {
      ticketId: t.arg.string({ required: true }),
      input: t.arg({ type: UserTicketTransferInfoInputRef, required: true }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (
      root,
      { ticketId, input },
      { DB, USER, RPC_SERVICE_EMAIL },
    ) => {
      if (!USER) {
        throw new GraphQLError("User not found");
      }

      const { email, name, message } = input;
      const cleanedEmail = cleanEmail(email);

      const userTicket = await DB.query.userTicketsSchema.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.id, ticketId), eq(t.userId, USER.id)),
        with: {
          ticketTemplate: {
            columns: {
              tags: true,
            },
          },
        },
      });

      if (!userTicket) {
        throw new GraphQLError("Ticket not found");
      }

      const validApprovalStatus: (typeof userTicketsApprovalStatusEnum)[number][] =
        ["approved", "not_required", "gift_accepted"];

      if (!validApprovalStatus.includes(userTicket.approvalStatus)) {
        throw new GraphQLError("Ticket is not transferable");
      }

      const recipientUser = await getOrCreateTransferRecipients({
        DB: DB,
        transferRecipients: [{ email: cleanedEmail, name }],
      }).then((result) => {
        if (!result) {
          return null;
        }

        return result.get(cleanedEmail);
      });

      if (!recipientUser) {
        throw new GraphQLError("Receiver user not found");
      }

      const userTicketTransfer: InsertUserTicketTransferSchema = {
        userTicketId: userTicket.id,
        senderUserId: USER.id,
        recipientUserId: recipientUser.id,
        status: UserTicketTransferStatus.Pending,
        expirationDate: getExpirationDateForTicketTransfer(),
        transferMessage: message ?? null,
      };

      const createdUserTicketTransfer = await DB.transaction(async (trx) => {
        await trx
          .update(userTicketsSchema)
          .set({
            approvalStatus: "gifted",
            userId: recipientUser.id,
          })
          .where(eq(userTicketsSchema.id, userTicket.id));

        const result = await trx
          .insert(userTicketTransfersSchema)
          .values(userTicketTransfer)
          .returning();

        return result[0];
      });

      if (!createdUserTicketTransfer) {
        throw new GraphQLError("Could not create user ticket transfer");
      }

      await RPC_SERVICE_EMAIL.sendTransferTicketConfirmations({
        transferId: createdUserTicketTransfer.id,
        transferMessage: userTicketTransfer.transferMessage ?? null,
        expirationDate: userTicketTransfer.expirationDate,
        recipientName: recipientUser.name ?? recipientUser.username,
        recipientEmail: recipientUser.email,
        senderName: USER.name ?? USER.username,
        ticketTags: userTicket.ticketTemplate.tags,
        senderEmail: USER.email,
      });

      return createdUserTicketTransfer;
    },
  }),
);

builder.mutationField("acceptTransferredTicket", (t) =>
  t.field({
    type: UserTicketRef,
    args: {
      transferId: t.arg.string({
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { transferId }, { DB, USER, RPC_SERVICE_EMAIL }) => {
      if (!USER) {
        throw new GraphQLError("User not found");
      }

      // find the ticket transfer
      const ticketTransfer = await DB.query.userTicketTransfersSchema.findFirst(
        {
          where: (t, { eq, and }) =>
            and(eq(t.id, transferId), eq(t.recipientUserId, USER.id)),
          columns: {
            id: true,
            status: true,
            expirationDate: true,
            userTicketId: true,
            senderUserId: true,
          },
          with: {
            senderUser: {
              columns: {
                name: true,
                email: true,
                username: true,
              },
            },
            userTicket: {
              with: {
                ticketTemplate: {
                  columns: {
                    tags: true,
                  },
                },
              },
            },
          },
        },
      );

      if (!ticketTransfer) {
        throw new GraphQLError("Could not find ticket to accept");
      }

      if (ticketTransfer.status !== UserTicketTransferStatus.Pending) {
        throw new GraphQLError("Ticket is not transferable");
      }

      if (ticketTransfer.expirationDate <= new Date()) {
        await DB.update(userTicketTransfersSchema)
          .set({
            status: UserTicketTransferStatus.Expired,
          })
          .where(eq(userTicketTransfersSchema.id, ticketTransfer.id));

        throw new GraphQLError("Transfer attempt has expired");
      }

      const updatedTicket = await DB.update(userTicketsSchema)
        .set({
          approvalStatus: "gift_accepted",
          userId: USER.id,
        })
        .where(eq(userTicketsSchema.id, ticketTransfer.userTicketId))
        .returning()
        .then((t) => t?.[0]);

      await DB.update(userTicketTransfersSchema)
        .set({
          status: UserTicketTransferStatus.Accepted,
        })
        .where(eq(userTicketTransfersSchema.id, ticketTransfer.id));

      await RPC_SERVICE_EMAIL.sendTransferAcceptanceNotificationToSender({
        recipientName: USER.name ?? USER.username,
        recipientEmail: USER.email,
        senderName:
          ticketTransfer.senderUser.name ?? ticketTransfer.senderUser.username,
        ticketTags: ticketTransfer.userTicket.ticketTemplate.tags,
      });

      return updatedTicket;
    },
  }),
);
