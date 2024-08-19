import { eq } from "drizzle-orm";
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

export const updateUserProfileInfo = async (
  db: ORM_TYPE,
  parsedProfileInfo: z.infer<typeof insertUsersSchema>,
  logger: Logger,
) => {
  const result = await db.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.email, parsedProfileInfo.email.toLowerCase()),
  });

  if (!result) {
    logger.info("User not found — creating new user");
    // we create the user
    const createdUsers = await db
      .insert(usersSchema)
      .values({
        externalId: parsedProfileInfo.externalId,
        email: parsedProfileInfo.email.trim().toLowerCase(),
        username: parsedProfileInfo.username ?? getUsername(),
        name: parsedProfileInfo.name,
        imageUrl: parsedProfileInfo.imageUrl,
        isEmailVerified: parsedProfileInfo.isEmailVerified,
        publicMetadata: parsedProfileInfo.publicMetadata ?? {},
        status: UserStatusEnum.active,
      })
      .returning();
    const createdUser = createdUsers?.[0];

    if (!createdUser) {
      logger.error("Could not create user");
      throw new Error("Could not create user");
    }

    return selectUsersSchema.parse(createdUser);
  } else {
    logger.info("User found — updating user");
    // we update the user
    const updateData = allowedUserUpdateForAuth.parse({
      externalId: parsedProfileInfo.externalId,
      name: parsedProfileInfo.name,
      imageUrl: parsedProfileInfo.imageUrl,
      isEmailVerified: parsedProfileInfo.isEmailVerified,
      publicMetadata: parsedProfileInfo.publicMetadata ?? {},
      status: UserStatusEnum.active,
    });
    const updatedUsers = await db
      .update(usersSchema)
      .set(updateData)
      .where(eq(usersSchema.email, parsedProfileInfo.email))
      .returning();
    const updatedUser = updatedUsers?.[0];

    if (!updatedUser) {
      logger.error("Could not update user");
      throw new Error("Could not update user");
    }

    logger.info("User updated");

    return selectUsersSchema.parse(updatedUser);
  }
};

export const upsertProfileInfo = async (
  db: ORM_TYPE,
  parsedProfileInfo: z.infer<typeof insertUsersSchema>,
  logger: Logger,
) => {
  const email = parsedProfileInfo.email.trim().toLowerCase();
  const upsertedUsers = await db
    .insert(usersSchema)
    .values({
      externalId: parsedProfileInfo.externalId,
      email,
      username: parsedProfileInfo.username ?? getUsername(),
      name: parsedProfileInfo.name,
      imageUrl: parsedProfileInfo.imageUrl,
      isEmailVerified: parsedProfileInfo.isEmailVerified,
      publicMetadata: parsedProfileInfo.publicMetadata ?? {},
      status: UserStatusEnum.active,
    })
    .onConflictDoUpdate({
      target: [usersSchema.email],
      set: {
        externalId: parsedProfileInfo.externalId,
        name: parsedProfileInfo.name,
        imageUrl: parsedProfileInfo.imageUrl,
        isEmailVerified: parsedProfileInfo.isEmailVerified,
        publicMetadata: parsedProfileInfo.publicMetadata ?? {},
      },
    })
    .returning();

  const upsertedUser = upsertedUsers?.[0];

  if (!upsertedUser) {
    logger.error("Could not upsert user");
    throw new Error("Could not upsert user");
  }

  logger.info("User updated", upsertedUser);

  return selectUsersSchema.parse(upsertedUser);
};
