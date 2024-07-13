import { builder } from "~/builder";
import { selectUserTicketsSchema } from "~/datasources/db/schema";
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
      type: TicketPaymentStatus,
      required: false,
    }),
    approvalStatus: t.field({
      type: TicketApprovalStatus,
      required: false,
    }),
    redemptionStatus: t.field({
      type: TicketRedemptionStatus,
      required: false,
    }),
  }),
});

const PaginatedUserTicketsRef = createPaginationObjectType(UserTicketRef);

const normalUserAllowedAppovalStatus = new Set([
  "approved",
  "not_required",
] as const);

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

      const queryApprovalStatus = approvalStatus
        ? USER.isSuperAdmin
          ? approvalStatus
          : normalUserAllowedAppovalStatus.has(approvalStatus)
          ? approvalStatus
          : undefined
        : undefined;

      const { data, pagination } =
        await userTicketFetcher.searchPaginatedUserTickets({
          DB,
          search: {
            eventIds: eventId ? [eventId] : undefined,
            userIds: [USER.id],
            paymentStatus: paymentStatus ? [paymentStatus] : undefined,
            approvalStatus: queryApprovalStatus
              ? [queryApprovalStatus]
              : undefined,
            redemptionStatus: redemptionStatus ? [redemptionStatus] : undefined,
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
