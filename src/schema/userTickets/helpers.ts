import { inArray } from "drizzle-orm";

import { ORM_TYPE, TRANSACTION_HANDLER } from "~/datasources/db";
import { TeamStatusEnum } from "~/datasources/db/teams";
import { UserParticipationStatusEnum } from "~/datasources/db/userTeams";
import {
  approveUserTicketsSchema,
  userTicketsSchema,
} from "~/datasources/db/userTickets";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";
import { eventsFetcher } from "~/schema/events/eventsFetcher";
import { ticketsFetcher } from "~/schema/ticket/ticketsFetcher";
import { userTicketFetcher } from "~/schema/userTickets/userTicketFetcher";
import { Context } from "~/types";

import {
  NormalizedTicketClaimInput,
  NormalizedTicketClaimOrder,
  TicketClaimTicketsInfo,
} from "./mutations/claimUserTicket";
import { validateAddonClaimsAndConstraints } from "../userTicketsAddons/helpers";

export const assertCanStartTicketClaimingForEvent = async (
  context: NonNullableFields<Pick<Context, "USER" | "logger">> & {
    DB: TRANSACTION_HANDLER;
  },
  ticketInfo: TicketClaimTicketsInfo,
  normalizedInput: NormalizedTicketClaimInput,
) => {
  const { DB, USER, logger } = context;
  const { tickets: ticketTemplates } = ticketInfo;

  const events = await eventsFetcher.searchEvents({
    DB,
    search: {
      ticketIds: ticketTemplates.map((t) => t.id),
    },
  });

  if (events.length > 1) {
    throw applicationError(
      "Multiple events found for tickets. This is not allowed for the time being (We are working on it)",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  const event = events[0];

  if (!event) {
    throw applicationError(
      "No event found for tickets",
      ServiceErrors.NOT_FOUND,
      logger,
    );
  }

  if (event.startDateTime < new Date()) {
    throw applicationError(
      "Event has already started",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  if (event.status === "inactive" && !USER.isSuperAdmin) {
    throw applicationError(
      `Event ${event.id} is not active. Cannot claim tickets for an inactive event.`,
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  ticketTemplates.forEach((ticket) => {
    const order = normalizedInput[ticket.id];

    validateTicketPurchase(ticket, order, logger);

    validateTransferRequests(order, USER, logger);

    validateAddonClaimsAndConstraints({
      ticketId: ticket.id,
      newAddonClaims: order.itemDetails.flatMap((i) => i.addonRequests),
      alreadyClaimedAddons: [],
      ticketRelatedAddonsInfo: ticketInfo.addons,
      logger,
    });
  });
};

function validateTicketPurchase(
  ticket: TicketClaimTicketsInfo["tickets"][0],
  order: NormalizedTicketClaimOrder,
  logger: Logger,
) {
  if (order.quantity <= 0) {
    throw applicationError(
      `Invalid quantity for ticket ${ticket.id}`,
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  if (ticket.maxTicketsPerUser && ticket.maxTicketsPerUser < order.quantity) {
    throw applicationError(
      `You cannot get more than ${ticket.maxTicketsPerUser} for ticket ${ticket.id}`,
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  if (ticket.tags?.includes("waitlist")) {
    throw applicationError(
      `Ticket ${ticket.id} is a waitlist ticket. Cannot claim waitlist tickets`,
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  if (order.itemDetails.length > order.quantity) {
    throw applicationError(
      "Item details exceed purchase order quantity",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }
}

function validateTransferRequests(
  order: NormalizedTicketClaimOrder,
  USER: NonNullable<Context["USER"]>,
  logger: Logger,
) {
  const isTransferringToSelf = order.itemDetails.some(
    (i) => i.transferInfo?.email === USER.email,
  );

  if (isTransferringToSelf) {
    throw applicationError(
      "Cannot transfer to yourself",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }
}

type ValidateUserDataAndApproveUserTicketsOptions = {
  DB: ORM_TYPE;
  userId: string;
  eventId: string;
  logger: Logger;
};

export const validateUserDataAndApproveUserTickets = async ({
  DB,
  userId,
  eventId,
  logger,
}: ValidateUserDataAndApproveUserTicketsOptions) => {
  const event = await eventsFetcher.searchEvents({
    DB,
    search: {
      eventIds: [eventId],
    },
  });

  if (!event) {
    throw applicationError("Event not found", ServiceErrors.NOT_FOUND, logger);
  }

  const userData = await DB.query.userDataSchema.findFirst({
    where: (t, { eq }) => eq(t.userId, userId),
    with: {
      user: {
        with: {
          userTeams: {
            columns: {
              id: true,
              userParticipationStatus: true,
            },
            with: {
              team: {
                columns: {
                  id: true,
                  teamStatus: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userData) {
    throw applicationError("User not found", ServiceErrors.NOT_FOUND, logger);
  }

  const userTickets = await userTicketFetcher.searchUserTickets({
    DB,
    search: {
      userIds: [userId],
      eventIds: [eventId],
      approvalStatus: ["gifted"],
    },
  });

  const ticketTemplatesOfUserTicketsByTemplateId = await ticketsFetcher
    .searchTickets({
      DB,
      search: {
        ticketIds: userTickets.map((ut) => ut.ticketTemplateId),
      },
    })
    .then((tickets) => {
      return tickets.reduce(
        (acc, ticket) => {
          acc[ticket.id] = ticket;

          return acc;
        },
        {} as Record<
          string,
          Awaited<ReturnType<typeof ticketsFetcher.searchTickets>>[0]
        >,
      );
    });

  const ticketTemplatesForTeams = [];
  const ticketTemplatesForAnyone = [];

  for (let i = 0; i < userTickets.length; i++) {
    const ut = userTickets[i];

    const ticketTemplate =
      ticketTemplatesOfUserTicketsByTemplateId[ut.ticketTemplateId];

    if (ticketTemplate.tags.includes("hackathon")) {
      ticketTemplatesForTeams.push(ticketTemplate);
    } else {
      ticketTemplatesForAnyone.push(ticketTemplate);
    }
  }

  const errors: string[] = [];

  if (!userData.rut) {
    errors.push("RUT is missing");
  }

  if (!userData.countryOfResidence) {
    errors.push("Country is missing");
  }

  if (!userData.city) {
    errors.push("City is missing");
  }

  if (ticketTemplatesForTeams.length > 0) {
    // If the user has a team, we check some values of userData.
    if (!userData.emergencyPhoneNumber) {
      errors.push("Emergency contact is missing");
    }

    if (!userData.foodAllergies) {
      errors.push("Emergency contact is missing");
    }

    const acceptedTeams = userData.user?.userTeams?.filter((ut) => {
      return ut.team.teamStatus === TeamStatusEnum.accepted;
    });

    if (!acceptedTeams || !acceptedTeams.length) {
      errors.push("User teams are not accepted");
    } else {
      const hasAcceptedParticipation = acceptedTeams.some((ut) => {
        return (
          ut.userParticipationStatus === UserParticipationStatusEnum.accepted
        );
      });

      if (!hasAcceptedParticipation) {
        errors.push("User has not accepted participation");
      }
    }
  }

  if (errors.length > 0) {
    throw applicationError(
      `Missing required conditions: ${errors.join(", ")}`,
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  const approvedUserTickets = await bulkApproveUserTickets({
    DB,
    userTicketIds: userTickets.map((ut) => ut.id),
  });

  return approvedUserTickets;
};

const bulkApproveUserTickets = async ({
  DB,
  userTicketIds,
}: {
  DB: ORM_TYPE;
  userTicketIds: string[];
}) => {
  const updated = await DB.update(userTicketsSchema)
    .set(
      approveUserTicketsSchema.parse({
        approvalStatus: "approved",
      }),
    )
    .where(inArray(userTicketsSchema.id, userTicketIds))
    .returning();

  return updated;
};
