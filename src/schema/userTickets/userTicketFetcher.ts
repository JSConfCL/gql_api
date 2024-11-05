import { SQL, and, desc, eq, inArray } from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import { eventsSchema } from "~/datasources/db/events";
import {
  PurchaseOrderPaymentStatus,
  purchaseOrdersSchema,
} from "~/datasources/db/purchaseOrders";
import { ticketsSchema } from "~/datasources/db/tickets";
import {
  UserTicketApprovalStatus,
  UserTicketRedemptionStatus,
  userTicketsSchema,
} from "~/datasources/db/userTickets";
import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";

export type UserTicketSearch = {
  userIds?: string[];
  publicIds?: string[];
  eventIds?: string[];
  userTicketIds?: string[];
  ticketIds?: string[];
  eventName?: string;
  approvalStatus?: UserTicketApprovalStatus[];
  paymentStatus?: PurchaseOrderPaymentStatus[];
  redemptionStatus?: UserTicketRedemptionStatus[];
};

const getSearchUserTicketsQuery = (
  DB: ORM_TYPE,
  search: UserTicketSearch = {},
) => {
  const {
    userIds,
    eventIds,
    publicIds,
    userTicketIds,
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

  if (eventIds && eventIds.length > 0) {
    const shouldFilterByUserIds = userIds && userIds.length > 0;

    // subquery to get all the tickets associated with events
    const existsQuery = DB.select({
      id: userTicketsSchema.id,
    })
      .from(userTicketsSchema)
      .innerJoin(
        ticketsSchema,
        eq(ticketsSchema.id, userTicketsSchema.ticketTemplateId),
      )
      .innerJoin(eventsSchema, eq(eventsSchema.id, ticketsSchema.eventId))
      .where(
        and(
          inArray(eventsSchema.id, eventIds),
          shouldFilterByUserIds
            ? inArray(userTicketsSchema.userId, userIds)
            : undefined,
        ),
      );

    wheres.push(inArray(userTicketsSchema.id, existsQuery));
  }

  if (paymentStatus && paymentStatus.length > 0) {
    const selectPurchaseOrders = DB.select({
      id: purchaseOrdersSchema.id,
    })
      .from(purchaseOrdersSchema)
      .where(
        inArray(purchaseOrdersSchema.purchaseOrderPaymentStatus, paymentStatus),
      );

    wheres.push(
      inArray(userTicketsSchema.purchaseOrderId, selectPurchaseOrders),
    );
  }

  if (approvalStatus && approvalStatus.length > 0) {
    wheres.push(inArray(userTicketsSchema.approvalStatus, approvalStatus));
  }

  if (redemptionStatus && redemptionStatus.length > 0) {
    wheres.push(inArray(userTicketsSchema.redemptionStatus, redemptionStatus));
  }

  if (publicIds && publicIds.length > 0) {
    wheres.push(inArray(userTicketsSchema.publicId, publicIds));
  }

  if (ticketIds && ticketIds.length > 0) {
    wheres.push(inArray(userTicketsSchema.ticketTemplateId, ticketIds));
  }

  if (userTicketIds && userTicketIds.length > 0) {
    wheres.push(inArray(userTicketsSchema.id, userTicketIds));
  }

  return query.where(and(...wheres)).orderBy(desc(userTicketsSchema.createdAt));
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
