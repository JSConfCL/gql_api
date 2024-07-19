import { SQL, and, asc, ilike, inArray } from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import {
  teamsSchema,
  TeamStatusEnum,
  userTeamsSchema,
} from "~/datasources/db/schema";
import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";

export type TeamSearch = {
  teamIds?: string[];
  eventIds?: string[];
  teamName?: string;
  description?: string;
  status?: TeamStatusEnum[];
  userIds?: string[];
};

const getSearchTeamQuery = (DB: ORM_TYPE, search: TeamSearch = {}) => {
  const { eventIds, teamIds, teamName, description, status, userIds } = search;

  const wheres: SQL[] = [];
  const query = DB.select().from(teamsSchema);

  if (eventIds && eventIds.length > 0) {
    wheres.push(inArray(teamsSchema.eventId, eventIds));
  }

  if (teamIds && teamIds.length > 0) {
    wheres.push(inArray(teamsSchema.id, teamIds));
  }

  if (teamName) {
    wheres.push(ilike(teamsSchema.name, sanitizeForLikeSearch(teamName)));
  }

  if (description) {
    wheres.push(
      ilike(teamsSchema.description, sanitizeForLikeSearch(description)),
    );
  }

  if (status && status.length > 0) {
    const subquery = DB.select({
      teamId: userTeamsSchema.teamId,
    })
      .from(userTeamsSchema)
      .where(and(inArray(userTeamsSchema.status, status)));

    wheres.push(inArray(teamsSchema.id, subquery));
  }

  if (userIds) {
    const subquery = DB.select({
      teamId: userTeamsSchema.teamId,
    })
      .from(userTeamsSchema)
      .where(inArray(userTeamsSchema.userId, userIds));

    wheres.push(inArray(teamsSchema.id, subquery));
  }

  // TODO: Make order by dynamic
  return query.where(and(...wheres)).orderBy(asc(teamsSchema.name));
};

export const getTeams = async (DB: ORM_TYPE, search: TeamSearch = {}) => {
  const results = await getSearchTeamQuery(DB, search).execute();

  return results;
};

export const getPaginatedTeams = async ({
  DB,
  search,
  pagination,
}: {
  DB: ORM_TYPE;
  search: TeamSearch;
  pagination: PaginationOptionsType;
}) => {
  const query = getSearchTeamQuery(DB, search);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const teamsFetcher = {
  getTeams,
  getPaginatedTeams,
};
