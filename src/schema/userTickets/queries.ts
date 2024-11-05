import { builder } from "~/builder";
import {
  selectUserTicketsSchema,
  USER,
  UserTicketApprovalStatus,
} from "~/datasources/db/schema";
import { applicationError, ServiceErrors } from "~/errors";
import {
  createPaginationInputType,
  createPaginationObjectType,
} from "~/schema/pagination/types";
import { PublicUserTicketRef, UserTicketRef } from "~/schema/shared/refs";
import { userTicketFetcher } from "~/schema/userTickets/userTicketFetcher";

import {
  ACCESSIBLE_USER_TICKET_APPROVAL_STATUSES,
  REDEEMABLE_USER_TICKET_APPROVAL_STATUSES,
} from "./constants";
import {
  TicketApprovalStatus,
  TicketPaymentStatus,
  TicketRedemptionStatus,
} from "./types";

const MyTicketsSearchValues = builder.inputType("MyTicketsSearchValues", {
  fields: (t) => ({
    eventId: t.field({
      type: "String",
      required: false,
    }),
    paymentStatus: t.field({
      type: [TicketPaymentStatus],
      required: false,
    }),
    approvalStatus: t.field({
      type: [TicketApprovalStatus],
      required: false,
    }),
    redemptionStatus: t.field({
      type: [TicketRedemptionStatus],
      required: false,
    }),
  }),
});

const PaginatedUserTicketsRef = createPaginationObjectType(UserTicketRef);

const getQueryApprovalStatus = (
  approvalStatus: UserTicketApprovalStatus[] | null | undefined,
  user: USER,
) => {
  if (user.isSuperAdmin) {
    return approvalStatus ?? undefined;
  }

  if (approvalStatus) {
    return approvalStatus.filter((status) =>
      ACCESSIBLE_USER_TICKET_APPROVAL_STATUSES.includes(status),
    );
  } else {
    return ACCESSIBLE_USER_TICKET_APPROVAL_STATUSES;
  }
};

builder.queryFields((t) => ({
  myTickets: t.field({
    description: "Get a list of tickets for the current user",
    type: PaginatedUserTicketsRef,
    args: createPaginationInputType(t, MyTicketsSearchValues),
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { input }, { DB, USER }) => {
      const { approvalStatus, eventId, paymentStatus, redemptionStatus } =
        input.search ?? {};

      if (!USER) {
        throw new Error("User not found");
      }

      const queryApprovalStatus = getQueryApprovalStatus(approvalStatus, USER);

      const { data, pagination } =
        await userTicketFetcher.searchPaginatedUserTickets({
          DB,
          search: {
            eventIds: eventId ? [eventId] : undefined,
            userIds: [USER.id],
            paymentStatus: paymentStatus ? paymentStatus : undefined,
            approvalStatus: queryApprovalStatus,
            redemptionStatus: redemptionStatus ? redemptionStatus : undefined,
          },
          pagination: input.pagination,
        });

      const results = data.map((t) => selectUserTicketsSchema.parse(t));

      return {
        data: results,
        pagination,
      };
    },
  }),
}));

const FindUserTicketSearchInput = builder.inputType(
  "FindUserTicketSearchInput",
  {
    fields: (t) => ({
      eventIds: t.stringList({
        required: false,
      }),
      userTicketIds: t.stringList({
        required: false,
      }),
      paymentStatus: t.field({
        type: [TicketPaymentStatus],
        required: false,
      }),
      ticketsIds: t.stringList({
        required: false,
      }),
      approvalStatus: t.field({
        type: [TicketApprovalStatus],
        required: false,
      }),
      redemptionStatus: t.field({
        type: [TicketRedemptionStatus],
        required: false,
      }),
      userIds: t.stringList({
        required: false,
      }),
    }),
  },
);

builder.queryField("findUserTickets", (t) =>
  t.field({
    description: "Get a list of user tickets",
    type: PaginatedUserTicketsRef,
    args: createPaginationInputType(t, FindUserTicketSearchInput),
    authz: {
      rules: ["IsSuperAdmin"],
    },
    resolve: async (root, { input }, { DB, USER }) => {
      const {
        approvalStatus,
        eventIds,
        paymentStatus,
        redemptionStatus,
        userIds,
        userTicketIds,
        ticketsIds,
      } = input.search ?? {};

      if (!USER) {
        throw new Error("User not found");
      }

      const queryApprovalStatus = getQueryApprovalStatus(approvalStatus, USER);

      const { data, pagination } =
        await userTicketFetcher.searchPaginatedUserTickets({
          DB,
          search: {
            eventIds: eventIds ? eventIds : undefined,
            userIds: userIds ? userIds : undefined,
            userTicketIds: userTicketIds ? userTicketIds : undefined,
            paymentStatus: paymentStatus ? paymentStatus : undefined,
            approvalStatus: queryApprovalStatus,
            ticketIds: ticketsIds ? ticketsIds : undefined,
            redemptionStatus: redemptionStatus ? redemptionStatus : undefined,
          },
          pagination: input.pagination,
        });

      const results = data.map((t) => selectUserTicketsSchema.parse(t));

      return {
        data: results,
        pagination,
      };
    },
  }),
);

const publicTicketInput = builder.inputType("PublicTicketInput", {
  fields: (t) => ({
    publicTicketId: t.string({
      required: true,
    }),
  }),
});

builder.queryField("publicTicketInfo", (t) =>
  t.field({
    description: "Get a list of user tickets",
    type: PublicUserTicketRef,
    args: {
      input: t.arg({
        type: publicTicketInput,
        required: true,
      }),
    },
    resolve: async (root, { input }, { DB, logger }) => {
      const { publicTicketId } = input;

      const { data: userTickets } =
        await userTicketFetcher.searchPaginatedUserTickets({
          DB,
          search: {
            publicIds: [publicTicketId],
            approvalStatus: REDEEMABLE_USER_TICKET_APPROVAL_STATUSES,
          },
          pagination: {
            page: 0,
            pageSize: 1,
          },
        });

      const userTicket = userTickets[0];

      if (!userTicket) {
        throw applicationError(
          "Ticket not found",
          ServiceErrors.NOT_FOUND,
          logger,
        );
      }

      return selectUserTicketsSchema.parse(userTicket);
    },
  }),
);
