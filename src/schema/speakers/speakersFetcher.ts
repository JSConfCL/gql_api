import { SQL, and, asc, ilike, inArray } from "drizzle-orm";

import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";
import { ORM_TYPE } from "~workers/db_service/db";
import {
  sessionToSpeakersSchema,
  speakerSchema,
} from "~workers/db_service/db/schema";

export type SpeakerSearch = {
  speakerIds?: string[];
  name?: string;
  bio?: string;
  eventIds?: string[];
  sessionIds?: string[];
};

type SortableType = null | undefined;

const getSearchSpeakersQuery = (
  DB: ORM_TYPE,
  search: SpeakerSearch = {},
  sort: SortableType,
) => {
  const { speakerIds, name, bio, eventIds, sessionIds } = search;

  const wheres: SQL[] = [];
  const query = DB.select().from(speakerSchema);

  if (speakerIds && speakerIds.length > 0) {
    wheres.push(inArray(speakerSchema.id, speakerIds));
  }

  if (name) {
    wheres.push(ilike(speakerSchema.name, sanitizeForLikeSearch(name)));
  }

  if (bio) {
    wheres.push(ilike(speakerSchema.bio, sanitizeForLikeSearch(bio)));
  }

  if (eventIds && eventIds.length) {
    wheres.push(inArray(speakerSchema.eventId, eventIds));
  }

  if (sessionIds && sessionIds.length) {
    const sessionsQuery = DB.select({
      id: sessionToSpeakersSchema.speakerId,
    })
      .from(sessionToSpeakersSchema)
      .where(inArray(sessionToSpeakersSchema.sessionId, sessionIds));

    wheres.push(inArray(speakerSchema.id, sessionsQuery));
  }

  const orderBy: SQL<unknown>[] = [];

  if (sort !== null) {
    orderBy.push(asc(speakerSchema.name));
  }

  return query.where(and(...wheres)).orderBy(...orderBy);
};

const searchSpeakers = async ({
  DB,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: SpeakerSearch;
  sort?: SortableType;
}) => {
  const speakers = await getSearchSpeakersQuery(DB, search, sort).execute();

  return speakers;
};

const searchPaginatedSpeakers = async ({
  DB,
  pagination,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: SpeakerSearch;
  pagination: PaginationOptionsType;
  sort?: SortableType;
}) => {
  const query = getSearchSpeakersQuery(DB, search, sort);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const speakersFetcher = {
  searchSpeakers,
  searchPaginatedSpeakers,
};
