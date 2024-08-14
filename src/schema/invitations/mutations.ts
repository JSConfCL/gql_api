import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  insertUserTicketsSchema,
  selectUserTicketsSchema,
  userTicketsSchema,
} from "~/datasources/db/schema";
import { applicationError, ServiceErrors } from "~/errors";
import { sendTicketInvitationEmails } from "~/notifications/tickets";
import { createInitialPurchaseOrder } from "~/schema/purchaseOrder/helpers";
import { UserTicketRef } from "~/schema/shared/refs";
import { ticketsFetcher } from "~/schema/ticket/ticketsFetcher";
import { usersFetcher } from "~/schema/user/userFetcher";

const GiftTicketsToUserInput = builder.inputType("GiftTicketsToUserInput", {
  fields: (t) => ({
    ticketId: t.string({ required: true }),
    userIds: t.stringList({ required: true }),
    allowMultipleTicketsPerUsers: t.boolean({ required: true }),
    notifyUsers: t.boolean({ required: false }),
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

      const { ticketId, allowMultipleTicketsPerUsers, notifyUsers } = input;
      let userIds = input.userIds;

      if (userIds.length === 0) {
        throw applicationError(
          "No users provided",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      const tickets = await ticketsFetcher.searchTickets({
        DB,
        search: {
          ticketIds: [ticketId],
        },
      });

      const ticket = tickets[0];

      if (!ticket) {
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

      if (!allowMultipleTicketsPerUsers) {
        const usersWithTickets = await DB.query.userTicketsSchema.findMany({
          where: (u, { and, inArray }) =>
            and(inArray(u.userId, userIds), eq(u.ticketTemplateId, ticket.id)),
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

      const createdUserTickets = await DB.insert(userTicketsSchema)
        .values(
          userIds.map((userId) =>
            insertUserTicketsSchema.parse({
              userId,
              ticketTemplateId: ticket.id,
              purchaseOrderId: purchaseOrder.id,
            }),
          ),
        )
        .returning();

      if (notifyUsers) {
        const userIdsWithTickets = createdUserTickets
          .map((userTicket) => userTicket.userId)
          .filter(Boolean);
        const users = await usersFetcher.searchUsers({
          DB,
          search: {
            userIds: userIdsWithTickets,
          },
        });

        await sendTicketInvitationEmails({
          DB,
          logger,
          ticketId: ticket.id,
          users,
          RPC_SERVICE_EMAIL,
        });
      }

      return createdUserTickets.map((userTicket) =>
        selectUserTicketsSchema.parse(userTicket),
      );
    },
  }),
);
