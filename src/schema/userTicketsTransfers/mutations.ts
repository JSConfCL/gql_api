import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  UserTicketTransferStatus,
  InsertUserTicketTransferSchema,
  userTicketTransfersSchema,
  userTicketsSchema,
  userTicketsApprovalStatusEnum,
} from "~/datasources/db/schema";
import { UserTicketTransferRef } from "~/schema/shared/refs";

import {
  sendAcceptTransferTicketSuccesfulEmail,
  sendStartTransferTicketSuccesfulEmails,
} from "./actions";
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
      { DB, USER, RPC_SERVICE_EMAIL, logger },
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
            with: {
              event: {
                with: {
                  logoImageReference: true,
                  eventsToCommunities: {
                    with: {
                      community: {
                        columns: {
                          name: true,
                          slug: true,
                          logoImageSanityRef: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!userTicket) {
        throw new GraphQLError("Ticket not found");
      }

      const validApprovalStatus: (typeof userTicketsApprovalStatusEnum)[number][] =
        [
          "approved",
          "not_required",
          "gift_accepted",
          "transfer_accepted",
          "transfer_pending",
        ];

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

      if (recipientUser.id === USER.id) {
        throw new GraphQLError("You cannot transfer a ticket to yourself");
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
            approvalStatus: "transfer_pending",
          })
          .where(eq(userTicketsSchema.id, userTicket.id));

        await trx
          .update(userTicketTransfersSchema)
          .set({
            status: UserTicketTransferStatus.Cancelled,
          })
          .where(
            and(
              eq(userTicketTransfersSchema.userTicketId, userTicket.id),
              eq(
                userTicketTransfersSchema.status,
                UserTicketTransferStatus.Pending,
              ),
            ),
          );

        const result = await trx
          .insert(userTicketTransfersSchema)
          .values(userTicketTransfer)
          .returning();

        return result[0];
      });

      if (!createdUserTicketTransfer) {
        throw new GraphQLError("Could not create user ticket transfer");
      }

      await sendStartTransferTicketSuccesfulEmails({
        userTicketTransfer: {
          ...userTicketTransfer,
          id: createdUserTicketTransfer.id,
          recipientUser,
          senderUser: USER,
          userTicket,
        },
        logger,
        transactionalEmailService: RPC_SERVICE_EMAIL,
      });

      return createdUserTicketTransfer;
    },
  }),
);

builder.mutationField("acceptTransferredTicket", (t) =>
  t.field({
    type: UserTicketTransferRef,
    args: {
      transferId: t.arg.string({
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (
      root,
      { transferId },
      { DB, USER, RPC_SERVICE_EMAIL, logger },
    ) => {
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
            recipientUser: {
              columns: {
                name: true,
                email: true,
                username: true,
              },
            },
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
                  with: {
                    event: {
                      with: {
                        logoImageReference: true,
                        eventsToCommunities: {
                          with: {
                            community: {
                              columns: {
                                name: true,
                                slug: true,
                                logoImageSanityRef: true,
                              },
                            },
                          },
                        },
                      },
                    },
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

      await DB.update(userTicketsSchema)
        .set({
          approvalStatus: "transfer_accepted",
          userId: USER.id,
        })
        .where(eq(userTicketsSchema.id, ticketTransfer.userTicketId));

      const updatedUserTicketTransfer = await DB.update(
        userTicketTransfersSchema,
      )
        .set({
          status: UserTicketTransferStatus.Accepted,
        })
        .where(eq(userTicketTransfersSchema.id, ticketTransfer.id))
        .returning()
        .then((t) => t?.[0]);

      await sendAcceptTransferTicketSuccesfulEmail({
        userTicketTransfer: ticketTransfer,
        logger,
        transactionalEmailService: RPC_SERVICE_EMAIL,
      });

      return updatedUserTicketTransfer;
    },
  }),
);
