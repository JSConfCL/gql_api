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
        userIds,
      } = input;

      if (userIds.length === 0) {
        throw applicationError(
          "No users provided",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      const actualTickets = await ticketsFetcher.searchTickets({
        DB,
        search: {
          ticketIds,
        },
      });
      const actualTicketIds = actualTickets.map((ticket) => ticket.id);

      const usersWithTickets = await DB.query.userTicketsSchema.findMany({
        where: (u, { and, inArray }) =>
          and(
            inArray(u.userId, userIds),
            inArray(u.ticketTemplateId, actualTicketIds),
          ),
      });

      let ticketTemplatesUsersMap = new Map<string, Set<string>>();

      for (const ticket of actualTickets) {
        if (!ticketTemplatesUsersMap.has(ticket.id)) {
          ticketTemplatesUsersMap.set(ticket.id, new Set());
        }
      }

      usersWithTickets.forEach((userWithTicket) => {
        if (userWithTicket.userId) {
          ticketTemplatesUsersMap
            .get(userWithTicket.ticketTemplateId)
            ?.add(userWithTicket.userId);
        }
      });

      if (ticketTemplatesUsersMap.size === 0) {
        throw applicationError(
          "Ticket not found",
          ServiceErrors.NOT_FOUND,
          logger,
        );
      }

      if (!allowMultipleTicketsPerUsers) {
        const clearedTicketTemplatesUserMap = new Map<string, Set<string>>();

        ticketTemplatesUsersMap.forEach((existingUserSet, ticketTemplateId) => {
          const newUserSet = new Set<string>();

          userIds.forEach((userId) => {
            if (!existingUserSet.has(userId)) {
              newUserSet.add(userId);
            }
          });

          clearedTicketTemplatesUserMap.set(ticketTemplateId, newUserSet);
        });

        ticketTemplatesUsersMap = clearedTicketTemplatesUserMap;
      }

      if (userIds.length === 0) {
        throw applicationError(
          "All provided users already have tickets",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      const purchaseOrder = await createInitialPurchaseOrder({
        DB,
        logger,
        userId: USER.id,
      });

      const ticketsToInsert: (typeof insertUserTicketsSchema._type)[] = [];

      ticketTemplatesUsersMap.forEach((userSet, ticketTemplateId) => {
        userSet.forEach((userId) => {
          const parsedData = insertUserTicketsSchema.parse({
            userId,
            ticketTemplateId,
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
