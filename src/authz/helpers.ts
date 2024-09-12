import { ORM_TYPE } from "~/datasources/db";
import { USER } from "~/datasources/db/schema";
import { Context } from "~/types";

const isCommuntiyAdmin = async ({
  user,
  communityId,
  DB,
}: {
  user: USER;
  communityId: string;
  DB: ORM_TYPE;
}) => {
  const isCommunityAdmin = await DB.query.usersToCommunitiesSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(
        eq(utc.communityId, communityId),
        eq(utc.userId, user.id),
        eq(utc.role, "admin"),
      ),
  });

  return Boolean(isCommunityAdmin);
};

const isOwnerOfPurchaseOrder = async ({
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
    columns: {
      id: true,
    },
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
  isCommuntiyAdmin,
  isOwnerOfPurchaseOrder,
  isSuperAdminOrSelf,
};
