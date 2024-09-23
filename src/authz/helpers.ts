import { and, eq, sql } from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import {
  eventsToCommunitiesSchema,
  SelectUsersToCommunitiesSchema,
  USER,
  usersToCommunitiesSchema,
} from "~/datasources/db/schema";
import { Context } from "~/types";

export const isCommunityAdmin = async ({
  userId,
  communityId,
  DB,
}: {
  userId: string;
  communityId: string;
  DB: ORM_TYPE;
}) => {
  const isCommunityAdmin = await DB.query.usersToCommunitiesSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(
        eq(utc.communityId, communityId),
        eq(utc.userId, userId),
        eq(utc.role, "admin"),
      ),
  });

  return Boolean(isCommunityAdmin);
};

export async function isAdminOfEventCommunity({
  DB,
  eventId,
  userId,
}: {
  DB: ORM_TYPE;
  eventId: string;
  userId: string;
}): Promise<boolean> {
  const roleName: SelectUsersToCommunitiesSchema["role"] = "admin";

  const result = await DB.select({
    isAdmin: sql<boolean>`CASE WHEN ${usersToCommunitiesSchema.role} = ${roleName} THEN TRUE ELSE FALSE END`,
  })
    .from(eventsToCommunitiesSchema)
    .leftJoin(
      usersToCommunitiesSchema,
      and(
        eq(
          usersToCommunitiesSchema.communityId,
          eventsToCommunitiesSchema.communityId,
        ),
        eq(usersToCommunitiesSchema.userId, userId),
      ),
    )
    .where(eq(eventsToCommunitiesSchema.eventId, eventId))
    .execute();

  return result.length > 0 && result[0].isAdmin;
}

export const isOwnerOfPurchaseOrder = async ({
  user,
  purchaseOrderId,
  DB,
}: {
  user: USER;
  purchaseOrderId: string;
  DB: ORM_TYPE;
}) => {
  const isOwner = await DB.query.purchaseOrdersSchema.findFirst({
    where: (po, { eq, and }) =>
      and(eq(po.id, purchaseOrderId), eq(po.userId, user.id)),
  });

  return Boolean(isOwner);
};

export const isSuperAdminOrSelf = (root: USER, ctx: Context) => {
  return ctx.USER?.isSuperAdmin || ctx.USER?.id === root.id;
};

export const areUsersOnSameTeam = async (root: USER, ctx: Context) => {
  const currentUserId = ctx.USER?.id;

  if (!currentUserId) {
    return false;
  }

  const teams = await ctx.DB.query.userTeamsSchema.findMany({
    where: (uts, { eq, or }) =>
      or(eq(uts.userId, root.id), eq(uts.userId, currentUserId)),
  });

  if (teams.length !== 2) {
    return false;
  }

  const [user1, user2] = teams;

  return user1.teamId === user2.teamId;
};

export const authHelpers = {
  isCommunityAdmin,
  isOwnerOfPurchaseOrder,
  isSuperAdminOrSelf,
  isAdminOfEventCommunity,
};
