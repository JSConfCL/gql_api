import { ORM_TYPE } from "~/datasources/db";
import { USER } from "~/datasources/db/schema";

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
  });

  return Boolean(isOwner);
};

export const authHelpers = {
  isCommuntiyAdmin,
  isOwnerOfPurchaseOrder,
};
