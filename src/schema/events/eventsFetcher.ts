import {
  SQL,
  and,
  asc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  lte,
} from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import { eventsSchema } from "~/datasources/db/events";
import {
  userTicketsSchema,
  ticketsSchema,
  eventsToCommunitiesSchema,
} from "~/datasources/db/schema";
import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";
import { eventStatus, eventVisibility } from "~/schema/events/types";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";

export type UserTicketSearch = {
  userId?: string;
  eventIds?: string[];
  eventName?: string;
  eventStatus?: (typeof eventStatus)[number][];
  eventVisibility?: (typeof eventVisibility)[number][];
  startDateTimeFrom?: Date;
  startDateTimeTo?: Date;
  communityIds?: string[];
  userHasTickets?: boolean;
};
const getSearchEventsQuery = (DB: ORM_TYPE, search: UserTicketSearch = {}) => {
  const {
    userId,
    eventIds,
    eventName,
    eventStatus,
    eventVisibility,
    startDateTimeFrom,
    startDateTimeTo,
    communityIds,
    userHasTickets,
  } = search;

  const wheres: SQL[] = [];
  const query = DB.select().from(eventsSchema);

  if (eventIds) {
    wheres.push(inArray(eventsSchema.id, eventIds));
  }

  if (eventName) {
    wheres.push(ilike(eventsSchema.name, sanitizeForLikeSearch(eventName)));
  }

  if (communityIds) {
    const subquery = DB.select({
      id: eventsToCommunitiesSchema.eventId,
    })
      .from(eventsToCommunitiesSchema)
      .where(inArray(eventsToCommunitiesSchema.communityId, communityIds));

    wheres.push(inArray(eventsSchema.id, subquery));
  }

  if (userHasTickets && userId) {
    const subquery = DB.select({
      id: ticketsSchema.id,
    })
      .from(ticketsSchema)
      .where(eq(ticketsSchema.eventId, eventsSchema.id));

    const existsQuery = exists(
      DB.select({
        ticket_template_id: userTicketsSchema.ticketTemplateId,
      })
        .from(userTicketsSchema)
        .where(
          and(
            inArray(userTicketsSchema.ticketTemplateId, subquery),
            eq(userTicketsSchema.approvalStatus, "approved"),
            eq(userTicketsSchema.userId, userId),
          ),
        ),
    );

    wheres.push(existsQuery);
  }

  if (eventStatus) {
    wheres.push(inArray(eventsSchema.status, eventStatus));
  }

  if (eventVisibility) {
    wheres.push(inArray(eventsSchema.visibility, eventVisibility));
  }

  if (startDateTimeFrom) {
    wheres.push(gte(eventsSchema.startDateTime, startDateTimeFrom));
  }

  if (startDateTimeTo) {
    wheres.push(lte(eventsSchema.startDateTime, startDateTimeTo));
  }

  return query.where(and(...wheres)).orderBy(asc(eventsSchema.startDateTime));
};

const searchEvents = async ({
  DB,
  search = {},
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
}) => {
  const events = await getSearchEventsQuery(DB, search).execute();

  return events;
};

const searchPaginatedEvents = async ({
  DB,
  pagination,
  search = {},
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
  pagination: PaginationOptionsType;
}) => {
  const query = getSearchEventsQuery(DB, search);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const eventsFetcher = {
  searchEvents,
  searchPaginatedEvents,
};
