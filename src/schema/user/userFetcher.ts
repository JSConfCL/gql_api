import { SQL, and, asc, desc, ilike, inArray, or } from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import {
  AllowedUserTags,
  tagsSchema,
  usersSchema,
  usersTagsSchema,
} from "~/datasources/db/schema";
import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";
import { SortableSchemaFields } from "~/datasources/helpers/sorting";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";

export type UserTicketSearch = {
  userIds?: string[];
  eventIds?: string[];
  userName?: string;
  email?: string;
  name?: string;
  tags?: AllowedUserTags[];
};

type SortableFields = "createdAt" | "name";
type UserFetcherSort = SortableSchemaFields<SortableFields>;

const getSearchUsersQuery = (
  DB: ORM_TYPE,
  search: UserTicketSearch = {},
  sort?: UserFetcherSort,
) => {
  const { userIds, userName, name, email, tags } = search;

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

  if (tags && tags.length > 0) {
    const selectTagsIds = DB.select({
      id: tagsSchema.id,
    })
      .from(tagsSchema)
      .where(inArray(tagsSchema.name, tags));
    const tagsSelect = DB.select({
      userId: usersTagsSchema.userId,
    })
      .from(usersTagsSchema)
      .where(inArray(usersTagsSchema.tagId, selectTagsIds));

    wheres.push(inArray(usersSchema.id, tagsSelect));
  }

  if (email) {
    wheres.push(ilike(usersSchema.email, sanitizeForLikeSearch(email)));
  }

  if (userName) {
    ilike(usersSchema.username, sanitizeForLikeSearch(userName));
  }

  const orderBy: SQL<unknown>[] = [];

  if (sort) {
    const sorts = sort.map(([field, direction]) => {
      const sortDirection = direction === "asc" ? asc : desc;

      return sortDirection(usersSchema[field]);
    });

    orderBy.push(...sorts);
  }

  return query.where(and(...wheres)).orderBy(...orderBy);
};

const searchUsers = async ({
  DB,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
  sort?: UserFetcherSort;
}) => {
  const users = await getSearchUsersQuery(DB, search, sort).execute();

  return users;
};

const searchPaginatedUsers = async ({
  DB,
  pagination,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: UserTicketSearch;
  pagination: PaginationOptionsType;
  sort?: UserFetcherSort;
}) => {
  const query = getSearchUsersQuery(DB, search, sort);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const usersFetcher = {
  searchUsers,
  searchPaginatedUsers,
};
