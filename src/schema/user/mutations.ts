import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import slugify from "slugify";

import { builder } from "~/builder";
import {
  insertUserDataSchema,
  insertUsersSchema,
  PronounsEnum,
  selectUsersSchema,
  updateUserDataSchema,
  updateUsersSchema,
  userDataSchema,
  usersSchema,
  usersToCommunitiesSchema,
} from "~/datasources/db/schema";
import { applicationError, ServiceErrors } from "~/errors";
import {
  sendActualUserTicketRPSVPsEmails,
  sendTicketInvitationEmails,
} from "~/notifications/tickets";
import { UserRef } from "~/schema/shared/refs";
import { pronounsEnum } from "~/schema/user/types";
import { usersFetcher } from "~/schema/user/userFetcher";
import { validateUserDataAndApproveUserTickets } from "~/schema/userTickets/helpers";
import {
  UserRoleCommunity,
  canUpdateUserRoleInCommunity,
  isSameUser,
} from "~/validations";

const userEditInput = builder.inputType("userEditInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ required: false }),
    lastName: t.string({ required: false }),
    bio: t.string({ required: false }),
    username: t.string({ required: false }),
    pronouns: t.field({ type: pronounsEnum, required: false }),
  }),
});

builder.mutationField("updateUser", (t) =>
  t.field({
    description: "Update a user",
    type: UserRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: userEditInput, required: true }),
    },
    resolve: async (root, { input }, ctx) => {
      try {
        const { id, name, lastName, bio, username, pronouns } = input;

        if (!ctx.USER) {
          throw new Error("User not found");
        }

        if (!isSameUser(id, ctx.USER.id)) {
          throw new Error("Not authorized");
        }

        const updateFields = {} as {
          name?: string;
          lastName?: string;
          bio?: string;
          username?: string;
          pronouns?: PronounsEnum;
        };

        if (name) {
          updateFields.name = name;
        }

        if (lastName) {
          updateFields.lastName = lastName;
        }

        if (bio) {
          updateFields.bio = bio;
        }

        if (username) {
          updateFields.username = username;
        }

        if (pronouns) {
          updateFields.pronouns = pronouns;
        }

        const userData = updateUsersSchema.parse(updateFields);
        const user = (
          await ctx.DB.update(usersSchema)
            .set(userData)
            .where(eq(usersSchema.id, id))
            .returning()
        )?.[0];

        return selectUsersSchema.parse(user);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
);

const updateUserRoleInCommunityInput = builder.inputType(
  "updateUserRoleInCommunityInput",
  {
    fields: (t) => ({
      userId: t.string({ required: true }),
      communityId: t.string({ required: true }),
      role: t.string({ required: true }),
    }),
  },
);

builder.mutationField("updateUserRoleInCommunity", (t) =>
  t.field({
    description: "Update a user role",
    type: UserRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: updateUserRoleInCommunityInput, required: true }),
    },
    resolve: async (root, { input }, ctx) => {
      try {
        const { userId, communityId, role } = input;

        if (!ctx.USER) {
          throw new Error("User not found");
        }

        if (
          !(await canUpdateUserRoleInCommunity(
            ctx.USER?.id,
            communityId,
            ctx.DB,
          ))
        ) {
          throw new Error("Not authorized");
        }

        await ctx.DB.update(usersToCommunitiesSchema)
          .set({
            role: role as UserRoleCommunity,
          })
          .where(eq(usersToCommunitiesSchema.userId, userId));

        const user = await ctx.DB.query.usersSchema.findFirst({
          where: (u, { eq }) => eq(u.id, userId),
        });

        return selectUsersSchema.parse(user);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
);

const updateUserDataInput = builder.inputType("updateUserDataInput", {
  fields: (t) => ({
    eventId: t.string({ required: true }),
    countryOfResidence: t.string({ required: true }),
    city: t.string({ required: true }),
    worksInOrganization: t.boolean({ required: true }),
    organizationName: t.string({ required: false }),
    roleInOrganization: t.string({ required: false }),
    rut: t.string({ required: false }),
    foodAllergies: t.string({ required: false }),
    emergencyPhoneNumber: t.string({ required: false }),
  }),
});

builder.mutationField("updateMyUserData", (t) =>
  t.field({
    type: UserRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: updateUserDataInput, required: true }),
    },
    resolve: async (root, { input }, ctx) => {
      const {
        countryOfResidence,
        city,
        worksInOrganization,
        organizationName,
        roleInOrganization,
        rut,
        foodAllergies,
        emergencyPhoneNumber,
      } = input;

      const USER = ctx.USER;

      if (!USER) {
        throw new Error("User not found");
      }

      const valuesToParse: Partial<typeof insertUserDataSchema._type> = {
        userId: USER.id,
        countryOfResidence,
        city,
        worksInOrganization,
        organizationName,
        roleInOrganization,
        emergencyPhoneNumber,
        rut,
        foodAllergies,
      };

      const userData = insertUserDataSchema.parse(valuesToParse);

      const updatedUsers = await ctx.DB.insert(userDataSchema)
        .values(userData)
        .onConflictDoUpdate({
          target: userDataSchema.userId,
          set: updateUserDataSchema.parse(userData),
        })
        .returning();
      const updatedUser = updatedUsers[0];

      if (!updatedUser) {
        throw applicationError(
          "Could not update the user information",
          ServiceErrors.NOT_FOUND,
          ctx.logger,
        );
      }

      if (input.eventId) {
        const changedUserTickets = await validateUserDataAndApproveUserTickets({
          DB: ctx.DB,
          userId: USER.id,
          eventId: input.eventId,
          logger: ctx.logger,
        });

        await sendActualUserTicketRPSVPsEmails({
          DB: ctx.DB,
          logger: ctx.logger,
          userTicketIds: changedUserTickets.map((t) => t.id),
          RPC_SERVICE_EMAIL: ctx.RPC_SERVICE_EMAIL,
        });
      }

      const user = await usersFetcher.searchUsers({
        DB: ctx.DB,
        search: {
          userIds: [USER.id],
        },
      });

      return selectUsersSchema.parse(user[0]);
    },
  }),
);

const placeHolderUsersInput = builder.inputType("placeHolderUsersInput", {
  fields: (t) => ({
    email: t.string({ required: true }),
    name: t.string({ required: true }),
  }),
});

const createPlaceholderUsersInput = builder.inputType(
  "CreatePlaceholderUsersInput",
  {
    fields: (t) => ({
      users: t.field({ type: [placeHolderUsersInput], required: true }),
    }),
  },
);

builder.mutationField("createPlaceholderdUsers", (t) =>
  t.field({
    description: "Create placeholder users (used for things like invitations)",
    type: [UserRef],
    nullable: false,
    authz: {
      rules: ["IsSuperAdmin"],
    },
    args: {
      input: t.arg({ type: createPlaceholderUsersInput, required: true }),
    },
    resolve: async (root, { input }, { DB, USER }) => {
      const { users } = input;

      if (!USER) {
        throw new Error("User not found");
      }

      const cleanedUsers = users.map((u) =>
        insertUsersSchema.parse({
          name: u.name.trim(),
          email: u.email.trim().toLowerCase(),
          username: `${slugify(u.name, { lower: true })}${Math.floor(
            Math.random() * 10,
          )}`,
        }),
      );

      const createdUsers = await DB.insert(usersSchema)
        .values(cleanedUsers)
        .onConflictDoNothing()
        .returning();

      const emails = cleanedUsers.map((u) => u.email);
      const ids = createdUsers.map((u) => u.id);

      const foundUsers = await DB.query.usersSchema.findMany({
        where: (u, { inArray, or }) =>
          or(inArray(u.email, emails), inArray(u.id, ids)),
      });

      return foundUsers.map((u) => selectUsersSchema.parse(u));
    },
  }),
);
