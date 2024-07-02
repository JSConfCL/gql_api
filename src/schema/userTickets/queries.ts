import { SQL, and, eq } from "drizzle-orm";

import { builder } from "~/builder";
import {
  eventsSchema,
  selectUserTicketsSchema,
  userTicketsSchema,
} from "~/datasources/db/schema";
import { paginationDBHelper } from "~/datasources/helpers/paginationQuery";
import {
  createPaginationObjectType,
  createPaginationInputType,
} from "~/schema/pagination/types";
import { UserTicketRef } from "~/schema/shared/refs";

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

builder.queryFields((t) => ({
  myTickets: t.field({
    description: "Get a list of tickets for the current user",
    type: PaginatedUserTicketsRef,
    args: createPaginationInputType(t, MyTicketsSearchValues),
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { input }, ctx) => {
      const { approvalStatus, eventId, paymentStatus, redemptionStatus } =
        input.search ?? {};

      const wheres: SQL[] = [];

      if (eventId) {
        wheres.push(eq(eventsSchema.id, eventId));
      }

      if (paymentStatus) {
        wheres.push(eq(userTicketsSchema.paymentStatus, paymentStatus));
      }

      if (approvalStatus) {
        wheres.push(eq(userTicketsSchema.approvalStatus, approvalStatus));
      }

      if (redemptionStatus) {
        wheres.push(eq(userTicketsSchema.redemptionStatus, redemptionStatus));
      }

      if (ctx.USER) {
        wheres.push(eq(userTicketsSchema.userId, ctx.USER.id));
      }

      const { data, pagination } = await paginationDBHelper(
        ctx.DB,
        ctx.DB.select()
          .from(userTicketsSchema)
          .where(and(...wheres)),
        input.pagination,
      );

      const results = data.map((t) => selectUserTicketsSchema.parse(t));

      return {
        data: results,
        pagination,
      };
    },
  }),
}));
