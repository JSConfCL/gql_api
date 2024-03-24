import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { ORM_TYPE } from "~/datasources/db";
import {
  insertUsersSchema,
  selectUsersSchema,
  usersSchema,
} from "~/datasources/db/schema";
import { getUsername } from "~/datasources/queries/utils/createUsername";

export const updateUserProfileInfo = async (
  db: ORM_TYPE,
  parsedProfileInfo: z.infer<typeof insertUsersSchema>,
) => {
  const result = await db.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.externalId, parsedProfileInfo.externalId),
  });
  if (!result) {
    console.log("User not found — creating new user");
    // we create the user
    const createdUsers = await db
      .insert(usersSchema)
      .values({
        oldId: parsedProfileInfo.oldId,
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
      console.error("Could not create user");
      throw new Error("Could not create user");
    }

    return selectUsersSchema.parse(createdUser);
  } else {
    console.log("User found — updating user");
    // we update the user
    const updatedUsers = await db
      .update(usersSchema)
      .set({
        name: parsedProfileInfo.name,
        imageUrl: parsedProfileInfo.imageUrl,
        emailVerified: parsedProfileInfo.emailVerified,
        publicMetadata: parsedProfileInfo.publicMetadata ?? {},
        updatedAt: sql`current_timestamp`,
      })
      .where(eq(usersSchema.externalId, parsedProfileInfo.externalId))
      .returning();
    const updatedUser = updatedUsers?.[0];
    if (!updatedUser) {
      console.error("Could not update user");
      throw new Error("Could not update user");
    }
    return selectUsersSchema.parse(updatedUser);
  }
};
