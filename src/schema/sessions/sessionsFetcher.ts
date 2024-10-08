import { SQL, and, asc, desc, ilike, inArray } from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import { sessionSchema } from "~/datasources/db/sessions";
import { sessionToSpeakersSchema } from "~/datasources/db/sessionsToSpeakers";
import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";
import { SortableSchemaFields } from "~/datasources/helpers/sorting";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";

export type SessionSearch = {
  sessionIds?: string[];
  scheduleIds?: string[];
  title?: string;
  description?: string;
  speakerIds?: string[];
};

type SortableFields =
  | "description"
  | "title"
  | "startTimestamp"
  | "endTimestamp";
type EventFetcherSort = SortableSchemaFields<SortableFields>;
const getSearchSessionsQuery = (
  DB: ORM_TYPE,
  search: SessionSearch = {},
  sort: EventFetcherSort,
) => {
  const { sessionIds, scheduleIds, title, description, speakerIds } = search;

  const wheres: SQL[] = [];
  const query = DB.select().from(sessionSchema);

  if (sessionIds && sessionIds.length > 0) {
    wheres.push(inArray(sessionSchema.id, sessionIds));
  }

  if (scheduleIds && scheduleIds.length > 0) {
    wheres.push(inArray(sessionSchema.scheduleId, scheduleIds));
  }

  if (title) {
    wheres.push(ilike(sessionSchema.title, sanitizeForLikeSearch(title)));
  }

  if (description) {
    wheres.push(
      ilike(sessionSchema.description, sanitizeForLikeSearch(description)),
    );
  }

  if (speakerIds && speakerIds.length > 0) {
    const speakersQuery = DB.select({
      sessionId: sessionToSpeakersSchema.sessionId,
    })
      .from(sessionToSpeakersSchema)
      .where(inArray(sessionToSpeakersSchema.speakerId, speakerIds));

    wheres.push(inArray(sessionSchema.id, speakersQuery));
  }

  const orderBy: SQL<unknown>[] = [];

  if (sort) {
    const sorts = sort.map(([field, direction]) => {
      const sortDirection = direction === "asc" ? asc : desc;

      return sortDirection(sessionSchema[field]);
    });

    orderBy.push(...sorts);
  }

  return query.where(and(...wheres)).orderBy(...orderBy);
};

const searchSessions = async ({
  DB,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: SessionSearch;
  sort?: EventFetcherSort;
}) => {
  const sessions = await getSearchSessionsQuery(DB, search, sort).execute();

  return sessions;
};

const searchPaginatedSessions = async ({
  DB,
  pagination,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: SessionSearch;
  pagination: PaginationOptionsType;
  sort?: EventFetcherSort;
}) => {
  const query = getSearchSessionsQuery(DB, search, sort);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const sessionsFetcher = {
  searchSessions,
  searchPaginatedSessions,
};
