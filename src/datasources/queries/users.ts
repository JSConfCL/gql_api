import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { ORM_TYPE } from "~/datasources/db";
import { selectUsersSchema, usersSchema } from "~/datasources/db/schema";
import { getUsername } from "~/datasources/queries/utils/createUsername";

export const ProfileInfoSchema = z.object({
  sub: z.string(),
  email: z.string(),
  email_verified: z.boolean(),
  image_url: z.string(),
  two_factor_enabled: z.boolean(),
  external_id: z.string().nullable(),
  name: z.string().default(""),
  surname: z.string().default(""),
  unsafe_metadata: z.any().optional(),
  public_metadata: z.any().optional(),
});
export const updateUserProfileInfo = async (
  db: ORM_TYPE,
  newProfileInfo: z.infer<typeof ProfileInfoSchema>,
) => {
  const parsedProfileInfo = ProfileInfoSchema.parse(newProfileInfo);
  const result = await db.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, parsedProfileInfo.sub),
  });
  if (!result) {
    console.log("User not found, creating new user");
    // we create the user
    const createdUser = (
      await db
        .insert(usersSchema)
        .values({
          id: parsedProfileInfo.sub,
          email: parsedProfileInfo.email,
          username: getUsername(),
          name: parsedProfileInfo.name,
          lastName: parsedProfileInfo.surname,
          twoFactorEnabled: parsedProfileInfo.two_factor_enabled,
          imageUrl: parsedProfileInfo.image_url,
          emailVerified: parsedProfileInfo.email_verified,
          unsafeMetadata: parsedProfileInfo.unsafe_metadata ?? {},
          publicMetadata: parsedProfileInfo.public_metadata ?? {},
          updatedAt: sql`current_timestamp`,
        })
        .returning()
    )?.[0];

    return selectUsersSchema.parse(createdUser);
  } else {
    console.log("User found for updating user");
    // we update the user
    const updatedUser = (
      await db
        .update(usersSchema)
        .set({
          name: parsedProfileInfo.name,
          lastName: parsedProfileInfo.surname,
          twoFactorEnabled: parsedProfileInfo.two_factor_enabled,
          imageUrl: parsedProfileInfo.image_url,
          emailVerified: parsedProfileInfo.email_verified,
          unsafeMetadata: parsedProfileInfo.unsafe_metadata ?? {},
          publicMetadata: parsedProfileInfo.public_metadata ?? {},
          updatedAt: sql`current_timestamp`,
        })
        .where(eq(usersSchema.id, parsedProfileInfo.sub))
        .returning()
    )?.[0];
    return selectUsersSchema.parse(updatedUser);
  }
};
