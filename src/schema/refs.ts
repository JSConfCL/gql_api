import { z } from "zod";
import { builder } from "~/builder";
import {
  selectCommunitySchema,
  selectTagsSchema,
} from "~/datasources/db/schema";
import { selectUsersSchema } from "~/datasources/db/schema";

type UserGraphqlSchema = z.infer<typeof selectUsersSchema>;
export const UserRef = builder.objectRef<UserGraphqlSchema>("User");

type CommunityGraphqlSchema = z.infer<typeof selectCommunitySchema>;
export const CommunityRef =
  builder.objectRef<CommunityGraphqlSchema>("Community");

type TagGraphqllSchema = z.infer<typeof selectTagsSchema>;
export const TagRef = builder.objectRef<TagGraphqllSchema>("Tag");
