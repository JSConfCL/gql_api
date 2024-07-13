import { SQL, and, asc, ilike, inArray, or } from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import { usersSchema } from "~/datasources/db/schema";
import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";

export type UserTicketSearch = {
  userIds?: string[];
  eventIds?: string[];
  userName?: string;
  name?: string;
};

const getSearchUsersQuery = (DB: ORM_TYPE, search: UserTicketSearch = {}) => {
  const { userIds, userName, name } = search;

  const wheres: SQL[] = [];
  const query = DB.select().from(usersSchema);

  if (userIds) {
    wheres.push(inArray(usersSchema.id, userIds));
  }

  if (name) {
    const userNameSelect = DB.select({
      id: usersSchema.id,
    })
      .from(usersSchema)
      .where(
        or(
          ilike(usersSchema.name, sanitizeForLikeSearch(name)),
          ilike(usersSchema.lastName, sanitizeForLikeSearch(name)),
        ),
      );

    wheres.push(inArray(usersSchema.id, userNameSelect));
  }

  if (userName) {
    ilike(usersSchema.username, sanitizeForLikeSearch(userName));
  }

  return query.where(and(...wheres)).orderBy(asc(usersSchema.createdAt));
};

const searchUsers = async ({
  DB,
  search = {},
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
}) => {
  const users = await getSearchUsersQuery(DB, search).execute();

  return users;
};

const searchPaginatedUsers = async ({
  DB,
  pagination,
  search = {},
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
  pagination: PaginationOptionsType;
}) => {
  const query = getSearchUsersQuery(DB, search);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const usersFetcher = {
  searchUsers,
  searchPaginatedUsers,
};
