import {
  SQL,
  and,
  asc,
  desc,
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
import { SortableSchemaFields } from "~/datasources/helpers/sorting";
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

type SortableFields = "createdAt" | "name" | "startDateTime" | "endDateTime";
type EventFetcherSort = SortableSchemaFields<SortableFields>;
const getSearchEventsQuery = (
  DB: ORM_TYPE,
  search: UserTicketSearch = {},
  sort: EventFetcherSort,
) => {
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

  const orderBy: SQL<unknown>[] = [];

  if (sort) {
    const sorts = sort.map(([field, direction]) => {
      const sortDirection = direction === "asc" ? asc : desc;

      return sortDirection(ticketsSchema[field]);
    });

    orderBy.push(...sorts);
  }

  return query.where(and(...wheres)).orderBy(...orderBy);
};

const searchEvents = async ({
  DB,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
  sort?: EventFetcherSort;
}) => {
  const events = await getSearchEventsQuery(DB, search, sort).execute();

  return events;
};

const searchPaginatedEvents = async ({
  DB,
  pagination,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
  pagination: PaginationOptionsType;
  sort?: EventFetcherSort;
}) => {
  const query = getSearchEventsQuery(DB, search, sort);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const eventsFetcher = {
  searchEvents,
  searchPaginatedEvents,
};
