import { SetOptional } from "type-fest";

import { ORM_TYPE } from "~/datasources/db";
import {
  insertUsersSchema,
  USER,
  usersSchema,
  UserStatusEnum,
} from "~/datasources/db/users";
import { Logger } from "~/logging";
import { usersFetcher } from "~/schema/user/userFetcher";

export const cleanEmail = (email: string) => {
  return email.trim().toLowerCase();
};

export const createUserIfNotExists = async ({
  DB,
  logger,
  email,
  userFields,
}: {
  DB: ORM_TYPE;
  email: string;
  logger: Logger;
  userFields?: Omit<SetOptional<USER, keyof USER>, "id" | "email">;
}) => {
  const result = await usersFetcher.searchUsers({
    DB,
    search: {
      email: cleanEmail(email),
    },
  });

  const user = result[0];

  if (!user) {
    const cleanedUserFields: {
      [key: string]: unknown;
    } = {};

    if (userFields) {
      Object.entries(userFields ?? {}).forEach(([key, value]) => {
        if (key === "id") {
          return;
        } else if (key === "email") {
          cleanedUserFields[key] = cleanEmail(value as string);
        } else if (key && value) {
          cleanedUserFields[key] = value;
        }
      });
    }

    const user = insertUsersSchema.parse(cleanedUserFields);

    logger.info("User not found — creating new user");
    // we create the user
    const createdUsers = await DB.insert(usersSchema).values(user).returning();
    const createdUser = createdUsers?.[0];

    if (!createdUser) {
      logger.error("Could not create user");
      throw new Error("Could not create user");
    }

    return createdUser;
  }

  throw new Error("User already exists");
};

export const createInactiveUser = async ({
  DB,
  logger,
  email,
}: {
  DB: ORM_TYPE;
  logger: Logger;
  email: string;
}) => {
  return createUserIfNotExists({
    DB,
    logger,
    email,
    userFields: {
      status: UserStatusEnum.inactive,
    },
  });
};
