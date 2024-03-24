import { USER } from "~/datasources/db/schema";

import { ORM_TYPE } from "../datasources/db";

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
        eq(utc.userId, user.oldId),
        eq(utc.role, "admin"),
      ),
  });

  return Boolean(isCommunityAdmin);
};

export const authHelpers = {
  isCommuntiyAdmin,
};
