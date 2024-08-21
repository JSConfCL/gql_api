import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  insertUserTicketsSchema,
  selectUserTicketsSchema,
  userTicketsSchema,
} from "~/datasources/db/schema";
import { applicationError, ServiceErrors } from "~/errors";
import {
  sendActualUserTicketQREmails,
  sendTicketInvitationEmails,
} from "~/notifications/tickets";
import { createInitialPurchaseOrder } from "~/schema/purchaseOrder/helpers";
import { UserTicketRef } from "~/schema/shared/refs";
import { ticketsFetcher } from "~/schema/ticket/ticketsFetcher";

const GiftTicketsToUserInput = builder.inputType("GiftTicketsToUserInput", {
  fields: (t) => ({
    ticketIds: t.stringList({ required: true }),
    userIds: t.stringList({ required: true }),
    allowMultipleTicketsPerUsers: t.boolean({ required: true }),
    autoApproveTickets: t.boolean({ required: true }),
    notifyUsers: t.boolean({ required: true }),
  }),
});

builder.mutationField("giftTicketsToUsers", (t) =>
  t.field({
    description:
      "Gift tickets to users, allowing multiple tickets per user, and conditionally notify them",
    type: [UserTicketRef],
    nullable: false,
    authz: {
      rules: ["IsSuperAdmin"],
    },
    args: {
      input: t.arg({ type: GiftTicketsToUserInput, required: true }),
    },
    resolve: async (
      root,
      { input },
      { DB, logger, USER, RPC_SERVICE_EMAIL },
    ) => {
      if (!USER) {
        throw new GraphQLError("User not found");
      }

      const {
        ticketIds,
        allowMultipleTicketsPerUsers,
        notifyUsers,
        autoApproveTickets,
      } = input;
      let userIds = input.userIds;

      if (userIds.length === 0) {
        throw applicationError(
          "No users provided",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      const foundTickets = await ticketsFetcher.searchTickets({
        DB,
        search: {
          ticketIds: ticketIds,
        },
      });

      if (!foundTickets[0]) {
        throw applicationError(
          "Ticket not found",
          ServiceErrors.NOT_FOUND,
          logger,
        );
      }

      const purchaseOrder = await createInitialPurchaseOrder({
        DB,
        logger,
        userId: USER.id,
      });

      const foundTicketIds = foundTickets.map((ticket) => ticket.id);

      if (!allowMultipleTicketsPerUsers) {
        const usersWithTickets = await DB.query.userTicketsSchema.findMany({
          where: (u, { and, inArray }) =>
            and(
              inArray(u.userId, userIds),
              inArray(u.ticketTemplateId, foundTicketIds),
            ),
          columns: {
            userId: true,
          },
        });

        const userIdsWithTickets = new Set(
          usersWithTickets.map((user) => user.userId),
        );

        userIds = userIds.filter((userId) => !userIdsWithTickets.has(userId));
      }

      if (userIds.length === 0) {
        throw applicationError(
          "All provided users already have tickets",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      const ticketsToInsert: (typeof insertUserTicketsSchema._type)[] = [];

      foundTickets.forEach((ticket) => {
        userIds.forEach((userId) => {
          const parsedData = insertUserTicketsSchema.parse({
            userId,
            ticketTemplateId: ticket.id,
            purchaseOrderId: purchaseOrder.id,
            approvalStatus: autoApproveTickets ? "approved" : "gifted",
          });

          ticketsToInsert.push(parsedData);
        });
      });

      const createdUserTickets = await DB.insert(userTicketsSchema)
        .values(ticketsToInsert)
        .returning();

      if (notifyUsers) {
        const userTicketIds = createdUserTickets.map(
          (userTicket) => userTicket.id,
        );

        if (autoApproveTickets) {
          await sendActualUserTicketQREmails({
            DB,
            logger,
            userTicketIds,
            RPC_SERVICE_EMAIL,
          });
        } else {
          await sendTicketInvitationEmails({
            DB,
            logger,
            userTicketIds,
            RPC_SERVICE_EMAIL,
          });
        }
      }

      return createdUserTickets.map((userTicket) =>
        selectUserTicketsSchema.parse(userTicket),
      );
    },
  }),
);
