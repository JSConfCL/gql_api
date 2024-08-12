import { builder } from "~/builder";
import {
  selectUserTicketsSchema,
  USER,
  userTicketsApprovalStatusEnum,
} from "~/datasources/db/schema";
import {
  createPaginationInputType,
  createPaginationObjectType,
} from "~/schema/pagination/types";
import { UserTicketRef } from "~/schema/shared/refs";
import { userTicketFetcher } from "~/schema/userTickets/userTicketFetcher";

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
  approvalStatus:
    | (typeof userTicketsApprovalStatusEnum)[number][]
    | null
    | undefined,
  user: USER,
) => {
  if (approvalStatus) {
    if (user.isSuperAdmin) {
      return approvalStatus;
    } else {
      return approvalStatus.filter((status) =>
        normalUserAllowedAppovalStatus.has(status),
      );
    }
  } else {
    return undefined;
  }
};

const normalUserAllowedAppovalStatus = new Set<
  (typeof userTicketsApprovalStatusEnum)[number]
>(["approved", "not_required", "gifted"]);

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
