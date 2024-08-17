import { SQL, and, asc, desc, ilike, inArray } from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import { scheduleSchema } from "~/datasources/db/schedule";
import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";
import { SortableSchemaFields } from "~/datasources/helpers/sorting";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";

export type SchedulesSearch = {
  scheduleIds?: string[];
  eventIds?: string[];
  title?: string;
  description?: string;
};

type SortableFields =
  | "description"
  | "title"
  | "startTimestamp"
  | "endTimestamp";
type EventFetcherSort = SortableSchemaFields<SortableFields>;

const getSearchSchedulesQuery = (
  DB: ORM_TYPE,
  search: SchedulesSearch = {},
  sort: EventFetcherSort,
) => {
  const { scheduleIds, title, description, eventIds } = search;

  const wheres: SQL[] = [];
  const query = DB.select().from(scheduleSchema);

  if (scheduleIds && scheduleIds.length > 0) {
    wheres.push(inArray(scheduleSchema.id, scheduleIds));
  }

  if (eventIds && eventIds.length > 0) {
    wheres.push(inArray(scheduleSchema.eventId, eventIds));
  }

  if (title) {
    wheres.push(ilike(scheduleSchema.title, sanitizeForLikeSearch(title)));
  }

  if (description) {
    wheres.push(
      ilike(scheduleSchema.description, sanitizeForLikeSearch(description)),
    );
  }

  const orderBy: SQL<unknown>[] = [];

  if (sort) {
    const sorts = sort.map(([field, direction]) => {
      const sortDirection = direction === "asc" ? asc : desc;

      return sortDirection(scheduleSchema[field]);
    });

    orderBy.push(...sorts);
  }

  return query.where(and(...wheres)).orderBy(...orderBy);
};

const searchSchedules = async ({
  DB,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: SchedulesSearch;
  sort?: EventFetcherSort;
}) => {
  const schedules = await getSearchSchedulesQuery(DB, search, sort).execute();

  return schedules;
};

const searchPaginatedSchedules = async ({
  DB,
  pagination,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: SchedulesSearch;
  pagination: PaginationOptionsType;
  sort?: EventFetcherSort;
}) => {
  const query = getSearchSchedulesQuery(DB, search, sort);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const schedulesFetcher = {
  searchSchedules,
  searchPaginatedSchedules,
};
