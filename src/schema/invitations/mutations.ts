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

// Input type definition for the giftTicketsToUsers mutation
const GiftTicketsToUserInput = builder.inputType("GiftTicketsToUserInput", {
  fields: (t) => ({
    ticketIds: t.stringList({ required: true }), // List of ticket template IDs to be gifted
    userIds: t.stringList({ required: true }), // List of user IDs to receive tickets
    allowMultipleTicketsPerUsers: t.boolean({ required: true }), // Whether users can receive duplicate tickets
    autoApproveTickets: t.boolean({ required: true }), // Whether tickets should be auto-approved
    notifyUsers: t.boolean({ required: true }), // Whether to send email notifications
  }),
});

builder.mutationField("giftTicketsToUsers", (t) =>
  t.field({
    description:
      "Gift tickets to users, allowing multiple tickets per user, and conditionally notify them",
    type: [UserTicketRef],
    nullable: false,
    authz: {
      rules: ["IsSuperAdmin"], // Only super admins can execute this mutation
    },
    args: {
      input: t.arg({ type: GiftTicketsToUserInput, required: true }),
    },
    resolve: async (
      root,
      { input },
      { DB, logger, USER, RPC_SERVICE_EMAIL },
    ) => {
      // Verify user is authenticated
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

      // Validate that users are provided
      if (userIds.length === 0) {
        throw applicationError(
          "No users provided",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      // Fetch actual tickets from the database using provided IDs
      const actualTickets = await ticketsFetcher.searchTickets({
        DB,
        search: {
          ticketIds,
        },
      });
      const actualTicketIds = actualTickets.map((ticket) => ticket.id);

      logger.info("actualTicketIds->", actualTicketIds);

      // Find existing tickets for these users to prevent duplicates if needed
      const usersWithTickets = await DB.query.userTicketsSchema.findMany({
        where: (u, { and, inArray }) =>
          and(
            inArray(u.userId, userIds),
            inArray(u.ticketTemplateId, actualTicketIds),
          ),
      });

      // Debug logging
      usersWithTickets.forEach((userWithTicket) => {
        logger.info("userWithTicket-->", JSON.stringify(userWithTicket));
      });

      // Initialize map to track which users should receive which tickets
      let ticketTemplatesUsersMap = new Map<string, Set<string>>();

      for (const ticket of actualTickets) {
        ticketTemplatesUsersMap.set(ticket.id, new Set());
      }

      // Handle user-ticket assignments based on allowMultipleTicketsPerUsers flag
      if (!allowMultipleTicketsPerUsers) {
        // If multiple tickets aren't allowed, track existing tickets
        usersWithTickets.forEach((userWithTicket) => {
          if (userWithTicket.userId) {
            ticketTemplatesUsersMap
              .get(userWithTicket.ticketTemplateId)
              ?.add(userWithTicket.userId);
          }
        });

        // Filter out users who already have tickets
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
        // If multiple tickets are allowed, assign all tickets to all users
        ticketTemplatesUsersMap.forEach((userSet, ticketTemplateId) => {
          userIds.forEach((userId) => {
            userSet.add(userId);
          });
        });
      }

      // Debug logging
      logger.info(
        "ticketTemplatesUsersMap->",
        JSON.stringify(ticketTemplatesUsersMap),
      );

      // Validate that we have tickets to process
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

      // Create purchase order for the tickets
      logger.info("About to create purchase order");
      const purchaseOrder = await createInitialPurchaseOrder({
        DB,
        logger,
        userId: USER.id,
      });

      logger.info("Purchase order created");

      // Prepare tickets for insertion
      const ticketsToInsert: (typeof insertUserTicketsSchema._type)[] = [];

      logger.info("About to create tickets");

      // Debug logging
      const jsonText = JSON.stringify(
        Array.from(ticketTemplatesUsersMap.entries()),
      );

      logger.info("------------" + jsonText);

      // Create ticket records for each user-ticket combination
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

      // Validate that we have tickets to insert
      if (!ticketsToInsert.length) {
        throw applicationError(
          "All provided users already have tickets",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      // Insert tickets into database
      logger.info("About to insert tickets");
      const createdUserTickets = await DB.insert(userTicketsSchema)
        .values(ticketsToInsert)
        .returning();

      logger.info("Tickets inserted");

      // Handle email notifications if enabled
      if (notifyUsers) {
        const userTicketIds = createdUserTickets.map(
          (userTicket) => userTicket.id,
        );

        if (autoApproveTickets) {
          // Send QR code emails for approved tickets
          await sendActualUserTicketQREmails({
            DB,
            logger,
            userTicketIds,
            RPC_SERVICE_EMAIL,
          });
        } else {
          // Send invitation emails for gifted tickets
          await sendTicketInvitationEmails({
            DB,
            logger,
            userTicketIds,
            RPC_SERVICE_EMAIL,
          });
        }
      }

      logger.info("Emails sent");

      // Return created tickets
      return createdUserTickets.map((userTicket) =>
        selectUserTicketsSchema.parse(userTicket),
      );
    },
  }),
);
