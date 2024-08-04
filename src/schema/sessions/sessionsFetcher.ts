import { SQL, and, asc, ilike, inArray } from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import { sessionSchema } from "~/datasources/db/sessions";
import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";

export type SessionSearch = {
  sessionIds?: string[];
  scheduleIds?: string[];
  title?: string;
  description?: string;
  speakerIds?: string[];
};

type SortableType = null | undefined;

const getSearchSessionsQuery = (
  DB: ORM_TYPE,
  search: SessionSearch = {},
  sort: SortableType,
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
      sessionId: sessionSchema.id,
    })
      .from(sessionSchema)
      .innerJoin(
        sessionToSpeakersSchema,
        sessionSchema.id.equals(sessionToSpeakersSchema.sessionId),
      )
      .where(inArray(sessionToSpeakersSchema.speakerId, speakerIds));

    wheres.push(inArray(sessionSchema.id, speakersQuery));
  }

  const orderBy: SQL<unknown>[] = [];

  if (sort !== null) {
    orderBy.push(asc(sessionSchema.startTimestamp));
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
  sort?: SortableType;
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
  sort?: SortableType;
}) => {
  const query = getSearchSessionsQuery(DB, search, sort);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const sessionsFetcher = {
  searchSessions,
  searchPaginatedSessions,
};
