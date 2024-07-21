import { SQL, and, asc, ilike, inArray } from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import {
  teamsSchema,
  TeamStatusEnum,
  UserTeamRoleEnum,
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
    wheres.push(inArray(teamsSchema.teamStatus, status));
  }

  if (userIds && userIds.length > 0) {
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

const getTeams = async ({
  DB,
  search,
}: {
  DB: ORM_TYPE;
  search: TeamSearch;
}) => {
  const results = await getSearchTeamQuery(DB, search).execute();

  return results;
};

const getPaginatedTeams = async ({
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

const getTeamForEdit = async ({
  DB,
  teamId,
  userId,
}: {
  DB: ORM_TYPE;
  teamId: string;
  userId: string;
}) => {
  const teamAndUsers = await DB.query.userTeamsSchema.findFirst({
    where: (t, { eq, and }) =>
      and(
        eq(t.teamId, teamId),
        eq(t.userId, userId),
        eq(t.role, UserTeamRoleEnum.leader),
      ),
    with: {
      team: true,
      user: true,
    },
  });

  return teamAndUsers?.team;
};

export const teamsFetcher = {
  getTeams,
  getTeamForEdit,
  getPaginatedTeams,
};
