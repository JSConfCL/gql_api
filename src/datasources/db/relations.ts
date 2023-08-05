import { relations } from "drizzle-orm";
import {
  communitySchema,
  usersSchema,
  eventsSchema,
  eventsToCommunitiesSchema,
  eventsToTagsSchema,
  eventsToUsersRolesSchema,
  eventsToUsersSchema,
  tagsSchema,
  tagsToCommunitiesSchema,
  usersToCommunitiesSchema,
  allowedCurrencySchema,
  ticketsSchema,
  userTicketsSchema,
  newsToCommunitiesSchema,
  newsSchema,
} from "~/datasources/db/tables";

export const userRelations = relations(usersSchema, ({ many }) => ({
  usersToCommunities: many(usersToCommunitiesSchema),
  usersToTickets: many(userTicketsSchema),
}));

export const communityRelations = relations(communitySchema, ({ many }) => ({
  usersToCommunities: many(usersToCommunitiesSchema),
  tagsToCommunities: many(tagsToCommunitiesSchema),
  eventsToCommunities: many(eventsToCommunitiesSchema),
  newsToCommunities: many(newsToCommunitiesSchema),
}));
export const usersToCommunitiesRelations = relations(
  usersToCommunitiesSchema,
  ({ one, many }) => ({
    community: one(communitySchema, {
      fields: [usersToCommunitiesSchema.communityId],
      references: [communitySchema.id],
    }),
    user: one(usersSchema, {
      fields: [usersToCommunitiesSchema.userId],
      references: [usersSchema.id],
    }),
    tickets: many(userTicketsSchema),
  }),
);

export const tagsToCommunitiesRelations = relations(
  tagsToCommunitiesSchema,
  ({ one }) => ({
    community: one(communitySchema, {
      fields: [tagsToCommunitiesSchema.communityId],
      references: [communitySchema.id],
    }),
    tag: one(tagsSchema, {
      fields: [tagsToCommunitiesSchema.tagId],
      references: [tagsSchema.id],
    }),
  }),
);

export const tagsRelations = relations(tagsSchema, ({ many }) => ({
  tagsToCommunities: many(tagsToCommunitiesSchema),
  tagsToEvents: many(eventsToTagsSchema),
}));

export const eventsRelations = relations(eventsSchema, ({ many }) => ({
  eventsToCommunities: many(eventsToCommunitiesSchema),
  eventsToTags: many(eventsToTagsSchema),
  eventsToUserTickets: many(userTicketsSchema),
}));

export const eventsToCommunitiesRelations = relations(
  eventsToCommunitiesSchema,
  ({ one }) => ({
    community: one(communitySchema, {
      fields: [eventsToCommunitiesSchema.communityId],
      references: [communitySchema.id],
    }),
    event: one(eventsSchema, {
      fields: [eventsToCommunitiesSchema.eventId],
      references: [eventsSchema.id],
    }),
  }),
);

export const newsRelations = relations(newsSchema, ({ one }) => ({
  newsToCommunities: one(newsToCommunitiesSchema),
}));

export const newsToCommunitiesRelations = relations(
  newsToCommunitiesSchema,
  ({ one }) => ({
    community: one(communitySchema, {
      fields: [newsToCommunitiesSchema.communityId],
      references: [communitySchema.id],
    }),
    new: one(newsSchema, {
      fields: [newsToCommunitiesSchema.newId],
      references: [newsSchema.id],
    }),
  }),
);

export const ticketTemplatesRelations = relations(
  ticketsSchema,
  ({ one, many }) => ({
    event: one(eventsSchema, {
      fields: [ticketsSchema.eventId],
      references: [eventsSchema.id],
    }),
    userTickets: many(userTicketsSchema),
    allowedCurrencySchema: one(allowedCurrencySchema, {
      fields: [ticketsSchema.currencyId],
      references: [allowedCurrencySchema.id],
    }),
  }),
);

export const userTIcketsRelations = relations(userTicketsSchema, ({ one }) => ({
  ticketTemplate: one(ticketsSchema, {
    fields: [userTicketsSchema.ticketTemplateId],
    references: [ticketsSchema.id],
  }),
  user: one(usersSchema, {
    fields: [userTicketsSchema.userId],
    references: [usersSchema.id],
  }),
}));

export const eventsToTagsRelations = relations(
  eventsToTagsSchema,
  ({ one }) => ({
    event: one(eventsSchema, {
      fields: [eventsToTagsSchema.eventId],
      references: [eventsSchema.id],
    }),
    tag: one(tagsSchema, {
      fields: [eventsToTagsSchema.tagId],
      references: [tagsSchema.id],
    }),
  }),
);

export const eventsToUsersRelations = relations(
  eventsToUsersSchema,
  ({ one }) => ({
    event: one(eventsSchema, {
      fields: [eventsToUsersSchema.eventId],
      references: [eventsSchema.id],
    }),
    user: one(usersSchema, {
      fields: [eventsToUsersSchema.userId],
      references: [usersSchema.id],
    }),
  }),
);

export const eventsToUsersRolesRelations = relations(
  eventsToUsersRolesSchema,
  ({ one }) => ({
    event: one(eventsSchema, {
      fields: [eventsToUsersRolesSchema.eventId],
      references: [eventsSchema.id],
    }),
    user: one(usersSchema, {
      fields: [eventsToUsersRolesSchema.userId],
      references: [usersSchema.id],
    }),
  }),
);
