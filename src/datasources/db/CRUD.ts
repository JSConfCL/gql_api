import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  communitySchema,
  eventsSchema,
  eventsToCommunitiesSchema,
  eventsToTagsSchema,
  tagsSchema,
  usersSchema,
  usersToCommunitiesSchema,
} from "~/datasources/db/tables";
export const selectUsersSchema = createSelectSchema(usersSchema);
export const insertUsersSchema = createInsertSchema(usersSchema);
export const selectCommunitySchema = createSelectSchema(communitySchema);
export const insertCommunitySchema = createInsertSchema(communitySchema);
export const selectTagsSchema = createSelectSchema(tagsSchema);
export const insertTagsSchema = createInsertSchema(tagsSchema);
export const selectEventsSchema = createSelectSchema(eventsSchema);
export const insertEventsSchema = createInsertSchema(eventsSchema);
export const selectEventsToTagsSchema = createSelectSchema(eventsToTagsSchema);
export const insertEventsToTagsSchema = createInsertSchema(eventsToTagsSchema);
export const selectUsersToCommunitiesSchema = createSelectSchema(
  usersToCommunitiesSchema,
);
export const insertUsersToCommunitiesSchema = createInsertSchema(
  usersToCommunitiesSchema,
);
export const selectEventsToCommunitiesSchema = createSelectSchema(
  eventsToCommunitiesSchema,
);
export const insertEventsToCommunitiesSchema = createInsertSchema(
  eventsToCommunitiesSchema,
);
