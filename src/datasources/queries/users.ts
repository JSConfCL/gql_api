import { z } from "zod";

import { ORM_TYPE } from "~/datasources/db";
import {
  allowedUserUpdateForAuth,
  insertUsersSchema,
  selectUsersSchema,
  usersSchema,
  UserStatusEnum,
} from "~/datasources/db/schema";
import { getUsername } from "~/datasources/queries/utils/createUsername";
import { Logger } from "~/logging";

export const findUserByID = async (db: ORM_TYPE, id: string) => {
  const result = await db.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, id),
  });

  return result ? selectUsersSchema.parse(result) : null;
};

export const upsertUserProfileInfo = async (
  db: ORM_TYPE,
  parsedProfileInfo: z.infer<typeof insertUsersSchema>,
  logger: Logger,
) => {
  logger.info(
    `Upserting user profile info for ${parsedProfileInfo.email} (externalId: ${
      parsedProfileInfo.externalId || "N/A"
    })`,
  );

  const { email, imageUrl, isEmailVerified, publicMetadata } =
    parsedProfileInfo;
  const lowercaseEmail = email.trim().toLowerCase();

  const upsertData: z.infer<typeof allowedUserUpdateForAuth> = {
    imageUrl,
    isEmailVerified,
    publicMetadata: publicMetadata ?? {},
    status: UserStatusEnum.active,
  };

  try {
    const result = await db
      .insert(usersSchema)
      .values({
        ...upsertData,
        email: lowercaseEmail,
        username: parsedProfileInfo.username ?? getUsername(email),
        name: parsedProfileInfo.name,
      })
      .onConflictDoUpdate({
        target: usersSchema.email,
        set: allowedUserUpdateForAuth.parse(upsertData),
      })
      .returning();

    const updatedUser = result[0];

    if (!updatedUser) {
      throw new Error("User operation failed");
    }

    logger.info(result.length > 1 ? "User updated" : "New user created");

    return selectUsersSchema.parse(updatedUser);
  } catch (error) {
    logger.error("Error in user operation", { error });
    throw new Error("User operation failed");
  }
};
