import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  communitySchema,
  insertCommunitySchema,
  selectCommunitySchema,
} from "~workers/db_service/db/schema";
import { CommunityRef } from "~/schema/shared/refs";
import { canCreateCommunity, canEditCommunity } from "~/validations";

import { CommnunityStatus } from "./types";

const CreateCommunityInput = builder.inputType("CreateCommunityInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    slug: t.string({ required: true }),
    description: t.string({ required: true }),
  }),
});
const UpdateCommunityInput = builder.inputType("UpdateCommunityInput", {
  fields: (t) => ({
    communityId: t.string({ required: true }),
    status: t.field({
      type: CommnunityStatus,
      required: false,
    }),
    name: t.string({ required: false }),
    slug: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});

builder.mutationFields((t) => ({
  createCommunity: t.field({
    description: "Create an community",
    type: CommunityRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: CreateCommunityInput, required: true }),
    },
    resolve: async (root, { input }, { USER, DB }) => {
      try {
        const { name, slug, description } = input;

        if (!USER) {
          throw new Error("User not found");
        }

        if (!canCreateCommunity(USER)) {
          throw new Error("FORBIDDEN");
        }

        const existSlug = await DB.query.communitySchema.findFirst({
          where: (c, { eq }) => eq(c.slug, input.slug),
        });

        if (existSlug) {
          throw new Error("This slug already exist");
        }

        const newCommunity = insertCommunitySchema.parse({
          name,
          slug,
          description,
        });

        const communities = (
          await DB.insert(communitySchema).values(newCommunity).returning()
        )?.[0];

        return selectCommunitySchema.parse(communities);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
  editCommunity: t.field({
    description: "Edit an community",
    type: CommunityRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: UpdateCommunityInput, required: true }),
    },
    resolve: async (root, { input }, { USER, DB }) => {
      try {
        const { communityId, status, description, name, slug } = input;

        if (!USER) {
          throw new Error("User not found");
        }

        if (!(await canEditCommunity(USER, communityId, DB))) {
          throw new Error("FORBIDDEN");
        }

        const dataToUpdate: Record<string, string | null | undefined> = {};

        const foundCommunity = await DB.query.communitySchema.findFirst({
          where: (c, { eq }) => eq(c.id, communityId),
        });

        if (!foundCommunity) {
          throw new Error("Community not found");
        }

        if (status) {
          dataToUpdate.status = status;
        }

        if (description) {
          dataToUpdate.description = description;
        }

        if (name) {
          dataToUpdate.name = name;
        }

        if (slug) {
          dataToUpdate.slug = slug;
        }

        const community = (
          await DB.update(communitySchema)
            .set(dataToUpdate)
            .where(eq(communitySchema.id, communityId))
            .returning()
        )?.[0];

        return selectCommunitySchema.parse(community);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
}));
