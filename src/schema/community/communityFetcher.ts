import { SQL, and, asc, ilike, inArray, lte } from "drizzle-orm";

import { ORM_TYPE } from "~workers/db_service/db";
import { communitySchema } from "~workers/db_service/db/schema";
import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";
import { communityStatus } from "~/schema/community/types";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";

export type UserTicketSearch = {
  communityIds?: string[];
  slug?: string;
  communityName?: string;
  communityStatus?: (typeof communityStatus)[number][];
  createdAt?: Date;
};
const getSearchCommunitiesQuery = (
  DB: ORM_TYPE,
  search: UserTicketSearch = {},
) => {
  const { slug, communityIds, communityName, communityStatus, createdAt } =
    search;

  const wheres: SQL[] = [];
  const query = DB.select().from(communitySchema);

  if (communityIds) {
    wheres.push(inArray(communitySchema.id, communityIds));
  }

  if (communityName) {
    wheres.push(
      ilike(communitySchema.name, sanitizeForLikeSearch(communityName)),
    );
  }

  if (communityStatus) {
    wheres.push(inArray(communitySchema.status, communityStatus));
  }

  if (slug) {
    wheres.push(ilike(communitySchema.slug, sanitizeForLikeSearch(slug)));
  }

  if (createdAt) {
    wheres.push(lte(communitySchema.createdAt, createdAt));
  }

  return query.where(and(...wheres)).orderBy(asc(communitySchema.createdAt));
};

const searchCommunities = async ({
  DB,
  search = {},
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
}) => {
  const communitys = await getSearchCommunitiesQuery(DB, search).execute();

  return communitys;
};

const searchPaginatedCommunities = async ({
  DB,
  pagination,
  search = {},
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
  pagination: PaginationOptionsType;
}) => {
  const query = getSearchCommunitiesQuery(DB, search);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const communitiesFetcher = {
  searchCommunities,
  searchPaginatedCommunities,
};
