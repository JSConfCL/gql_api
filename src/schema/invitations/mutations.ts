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

      logger.info("actualTicketIds->", actualTicketIds);

      const usersWithTickets = await DB.query.userTicketsSchema.findMany({
        where: (u, { and, inArray }) =>
          and(
            inArray(u.userId, userIds),
            inArray(u.ticketTemplateId, actualTicketIds),
          ),
      });

      console.log("usersWithTickets->", usersWithTickets.toString());

      usersWithTickets.forEach((userWithTicket) => {
        logger.info("userWithTicket-->", JSON.stringify(userWithTicket));
      });

      let ticketTemplatesUsersMap = new Map<string, Set<string>>();

      for (const ticket of actualTickets) {
        ticketTemplatesUsersMap.set(ticket.id, new Set());
      }

      if (!allowMultipleTicketsPerUsers) {
        usersWithTickets.forEach((userWithTicket) => {
          if (userWithTicket.userId) {
            ticketTemplatesUsersMap
              .get(userWithTicket.ticketTemplateId)
              ?.add(userWithTicket.userId);
          }
        });

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
      } else {
        ticketTemplatesUsersMap.forEach((userSet, ticketTemplateId) => {
          userIds.forEach((userId) => {
            userSet.add(userId);
          });
        });
      }

      logger.info(
        "ticketTemplatesUsersMap->",
        JSON.stringify(ticketTemplatesUsersMap),
      );

      if (ticketTemplatesUsersMap.size === 0) {
        throw applicationError(
          "Ticket not found",
          ServiceErrors.NOT_FOUND,
          logger,
        );
      }

      logger.info("Ticket templates users map", ticketTemplatesUsersMap);

      if (userIds.length === 0) {
        throw applicationError(
          "All provided users already have tickets.",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      logger.info("About to create purchase order");
      const purchaseOrder = await createInitialPurchaseOrder({
        DB,
        logger,
        userId: USER.id,
      });

      logger.info("Purchase order created");

      const ticketsToInsert: (typeof insertUserTicketsSchema._type)[] = [];

      logger.info("About to create tickets");

      const jsonText = JSON.stringify(
        Array.from(ticketTemplatesUsersMap.entries()),
      );

      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      logger.info("------------" + jsonText);

      ticketTemplatesUsersMap.forEach((userSet, ticketTemplateId) => {
        logger.info("userSet->", JSON.stringify(userSet));

        userSet.forEach((userId) => {
          const parsedData = insertUserTicketsSchema.parse({
            userId,
            ticketTemplateId,
            purchaseOrderId: purchaseOrder.id,
            approvalStatus: autoApproveTickets ? "approved" : "gifted",
          });

          logger.info("parsedData", parsedData);

          ticketsToInsert.push(parsedData);
        });
      });

      logger.info("Tickets created");

      if (!ticketsToInsert.length) {
        throw applicationError(
          "All provided users already have tickets",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      logger.info("About to insert tickets");

      const createdUserTickets = await DB.insert(userTicketsSchema)
        .values(ticketsToInsert)
        .returning();

      logger.info("Tickets inserted");

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

      logger.info("Emails sent");

      return createdUserTickets.map((userTicket) =>
        selectUserTicketsSchema.parse(userTicket),
      );
    },
  }),
);
