import { SQL, and, arrayContains, asc, inArray } from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import { eventsSchema } from "~/datasources/db/events";
import {
  ticketsSchema,
  ticketStatusEnum,
  ticketVisibilityEnum,
} from "~/datasources/db/schema";
import {
  paginationDBHelper,
  PaginationOptionsType,
} from "~/datasources/helpers/paginationQuery";

export type TicketsSearch = {
  ticketIds?: string[];
  ticketTags?: string[];
  status?: (typeof ticketStatusEnum)[number][];
  visibility?: (typeof ticketVisibilityEnum)[number][];
};

type SortableType =
  // TODO: Implement sorting
  // | [{ field: string; direction: "asc" | "desc" }]
  null | undefined;

const getSearchTicketQuery = (
  DB: ORM_TYPE,
  search: TicketsSearch = {},
  sort: SortableType,
) => {
  const { ticketIds, ticketTags, status, visibility } = search;

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

  const orderBy: SQL<unknown>[] = [];

  if (sort !== null) {
    // This is to support data loaders. for data loaders we should not order by anything.
    // TODO: Handle the case for doing actual column sorting
    orderBy.push(asc(eventsSchema.startDateTime));
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
  sort?: SortableType;
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
  sort?: SortableType;
}) => {
  const query = getSearchTicketQuery(DB, search, sort);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const ticketsFetcher = {
  searchTickets,
  searchPaginatedTickets,
};
