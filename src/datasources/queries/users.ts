import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { ORM_TYPE } from "~/datasources/db";
import {
  insertUsersSchema,
  selectUsersSchema,
  usersSchema,
} from "~/datasources/db/schema";
import { getUsername } from "~/datasources/queries/utils/createUsername";
import { logger } from "~/logging";

export const updateUserProfileInfo = async (
  db: ORM_TYPE,
  parsedProfileInfo: z.infer<typeof insertUsersSchema>,
) => {
  const result = await db.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.email, parsedProfileInfo.email),
  });

  if (!result) {
    logger.info("User not found — creating new user");
    // we create the user
    const createdUsers = await db
      .insert(usersSchema)
      .values({
        externalId: parsedProfileInfo.externalId,
        email: parsedProfileInfo.email,
        username: parsedProfileInfo.username ?? getUsername(),
        name: parsedProfileInfo.name,
        imageUrl: parsedProfileInfo.imageUrl,
        emailVerified: parsedProfileInfo.emailVerified,
        publicMetadata: parsedProfileInfo.publicMetadata ?? {},
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
    const updatedUsers = await db
      .update(usersSchema)
      .set({
        externalId: parsedProfileInfo.externalId,
        name: parsedProfileInfo.name,
        imageUrl: parsedProfileInfo.imageUrl,
        emailVerified: parsedProfileInfo.emailVerified,
        publicMetadata: parsedProfileInfo.publicMetadata ?? {},
        updatedAt: sql`current_timestamp`,
      })
      .where(eq(usersSchema.email, parsedProfileInfo.email))
      .returning();
    const updatedUser = updatedUsers?.[0];

    if (!updatedUser) {
      logger.error("Could not update user");
      throw new Error("Could not update user");
    }

    return selectUsersSchema.parse(updatedUser);
  }
};
