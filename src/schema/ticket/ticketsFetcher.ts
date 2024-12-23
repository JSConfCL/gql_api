import {
  SQL,
  and,
  arrayContains,
  asc,
  desc,
  inArray,
  eq,
  isNull,
} from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import {
  ticketsSchema,
  ticketStatusEnum,
  ticketVisibilityEnum,
} from "~/datasources/db/schema";
import {
  paginationDBHelper,
  PaginationOptionsType,
} from "~/datasources/helpers/paginationQuery";
import { SortableSchemaFields } from "~/datasources/helpers/sorting";

export type TicketsSearch = {
  couponId?: string;
  ticketIds?: string[];
  ticketTags?: string[];
  eventIds?: string[];
  status?: (typeof ticketStatusEnum)[number][];
  tags?: string[];
  visibility?: (typeof ticketVisibilityEnum)[number][];
};

type SortableFields = "startDateTime" | "createdAt";
type TicketFetcherSort = SortableSchemaFields<SortableFields>;

const getSearchTicketQuery = (
  DB: ORM_TYPE,
  search: TicketsSearch = {},
  sort: TicketFetcherSort,
) => {
  const {
    ticketIds,
    eventIds,
    ticketTags,
    status,
    visibility,
    tags,
    couponId,
  } = search;

  const query = DB.select().from(ticketsSchema);
  const wheres: SQL[] = [];

  if (ticketIds && ticketIds.length > 0) {
    wheres.push(inArray(ticketsSchema.id, ticketIds));
  }

  if (ticketTags && ticketTags.length > 0) {
    wheres.push(arrayContains(ticketsSchema.tags, ticketTags));
  }

  if (status && status.length > 0) {
    wheres.push(inArray(ticketsSchema.status, status));
  }

  if (visibility && visibility.length > 0) {
    wheres.push(inArray(ticketsSchema.visibility, visibility));
  }

  if (tags && tags.length > 0) {
    const cleanedTags = tags.map((tag) => tag.trim().toLowerCase());

    wheres.push(arrayContains(ticketsSchema.tags, cleanedTags));
  }

  if (eventIds && eventIds.length > 0) {
    wheres.push(inArray(ticketsSchema.eventId, eventIds));
  }

  if (couponId && couponId.length > 0) {
    wheres.push(eq(ticketsSchema.couponId, couponId));
  } else {
    wheres.push(isNull(ticketsSchema.couponId));
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

const searchTickets = async ({
  DB,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: TicketsSearch;
  sort?: TicketFetcherSort;
}) => {
  const tickets = await getSearchTicketQuery(DB, search, sort).execute();

  return tickets;
};

const searchPaginatedTickets = async ({
  DB,
  pagination,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: TicketsSearch;
  pagination: PaginationOptionsType;
  sort?: TicketFetcherSort;
}) => {
  const query = getSearchTicketQuery(DB, search, sort);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const ticketsFetcher = {
  searchTickets,
  searchPaginatedTickets,
};
