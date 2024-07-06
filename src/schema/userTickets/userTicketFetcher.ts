import {
  ColumnBaseConfig,
  ColumnDataType,
  SQL,
  and,
  eq,
  exists,
  inArray,
} from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import { eventsSchema } from "~/datasources/db/events";
import { puchaseOrderPaymentStatusEnum } from "~/datasources/db/purchaseOrders";
import { ticketsSchema } from "~/datasources/db/tickets";
import {
  userTicketsApprovalStatusEnum,
  userTicketsRedemptionStatusEnum,
  userTicketsSchema,
} from "~/datasources/db/userTickets";
import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";

export type UserTicketSearch = {
  userIds?: string[];
  eventIds?: string[];
  ticketIds?: string[];
  eventName?: string;
  approvalStatus?: (typeof userTicketsApprovalStatusEnum)[number][];
  paymentStatus?: (typeof puchaseOrderPaymentStatusEnum)[number][];
  redemptionStatus?: (typeof userTicketsRedemptionStatusEnum)[number][];
};
const getSearchUserTicketsQuery = (
  DB: ORM_TYPE,
  search: UserTicketSearch = {},
) => {
  const {
    userIds,
    eventIds,
    ticketIds,
    approvalStatus,
    redemptionStatus,
    paymentStatus,
  } = search;

  const query = DB.select().from(userTicketsSchema);

  const wheres: SQL[] = [];

  if (userIds) {
    wheres.push(inArray(userTicketsSchema.userId, userIds));
  }

  if (eventIds) {
    const existsQuery = DB.select()
      .from(userTicketsSchema)
      .leftJoin(
        ticketsSchema,
        eq(ticketsSchema.id, userTicketsSchema.ticketTemplateId),
      )
      .leftJoin(eventsSchema, eq(eventsSchema.id, ticketsSchema.eventId))
      .where(inArray(eventsSchema.id, eventIds));

    wheres.push(exists(existsQuery));
  }

  if (paymentStatus) {
    wheres.push(inArray(userTicketsSchema.paymentStatus, paymentStatus));
  }

  if (approvalStatus) {
    wheres.push(inArray(userTicketsSchema.approvalStatus, approvalStatus));
  }

  if (redemptionStatus) {
    wheres.push(inArray(userTicketsSchema.redemptionStatus, redemptionStatus));
  }

  if (ticketIds) {
    wheres.push(inArray(userTicketsSchema.id, ticketIds));
  }

  return query.where(and(...wheres));
};

const searchUserTickets = async ({
  DB,
  search = {},
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
}) => {
  const userTickets = await getSearchUserTicketsQuery(DB, search).execute();

  return userTickets;
};

const searchPaginatedUserTickets = async ({
  DB,
  pagination,
  search = {},
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
  pagination: PaginationOptionsType;
}) => {
  const query = getSearchUserTicketsQuery(DB, search);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const userTicketFetcher = {
  searchUserTickets,
  searchPaginatedUserTickets,
};
