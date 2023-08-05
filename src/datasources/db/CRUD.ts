import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  communitySchema,
  eventsSchema,
  eventsToCommunitiesSchema,
  eventsToTagsSchema,
  tagsSchema,
  usersSchema,
  usersToCommunitiesSchema,
  allowedCurrencySchema,
  ticketsSchema,
  userTicketsSchema,
  newsSchema,
  newsToCommunitiesSchema,
} from "~/datasources/db/tables";
export const selectUsersSchema = createSelectSchema(usersSchema);
export const insertUsersSchema = createInsertSchema(usersSchema);

export const selectCommunitySchema = createSelectSchema(communitySchema);
export const insertCommunitySchema = createInsertSchema(communitySchema);

export const selectTagsSchema = createSelectSchema(tagsSchema);
export const insertTagsSchema = createInsertSchema(tagsSchema);

export const selectEventsSchema = createSelectSchema(eventsSchema);
export const insertEventsSchema = createInsertSchema(eventsSchema);

export const selectNewsSchema = createSelectSchema(newsSchema);
export const insertNewsSchema = createInsertSchema(newsSchema);

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

export const selectNewsToCommunitiesSchema = createSelectSchema(
  newsToCommunitiesSchema,
);
export const insertNewsToCommunitiesSchema = createInsertSchema(
  newsToCommunitiesSchema,
);

export const selectAllowedCurrencySchema = createSelectSchema(
  allowedCurrencySchema,
);
export const insertAllowedCurrencySchema = createInsertSchema(
  allowedCurrencySchema,
);

export const selectTicketSchema = createSelectSchema(ticketsSchema);
export const insertTicketSchema = createInsertSchema(ticketsSchema);

export const selectUserTicketsSchema = createSelectSchema(userTicketsSchema);
export const insertUserTicketsSchema = createInsertSchema(userTicketsSchema);

