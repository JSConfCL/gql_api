import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  eventsSchema,
  eventsToCommunitiesSchema,
  insertEventsSchema,
  selectEventsSchema,
  updateEventsSchema,
} from "~workers/db_service/db/schema";
import { EventRef } from "~/schema/shared/refs";
import { canCreateEvent, canEditEvent } from "~/validations";

import { EventStatus, EventVisibility } from "./types";

const EventCreateInput = builder.inputType("EventCreateInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: true }),
    communityId: t.string({ required: true }),
    status: t.field({
      type: EventStatus,
      required: false,
    }),
    visibility: t.field({
      type: EventVisibility,
      required: false,
    }),
    startDateTime: t.field({
      type: "DateTime",
      required: true,
    }),
    endDateTime: t.field({
      type: "DateTime",
      required: false,
    }),
    timeZone: t.string({ required: false }),
    latitude: t.string({ required: false }),
    longitude: t.string({ required: false }),
    address: t.string({ required: false }),
    meetingURL: t.string({ required: false }),
  }),
});

const EventEditInput = builder.inputType("EventEditInput", {
  fields: (t) => ({
    eventId: t.string({ required: true }),
    name: t.string({ required: false }),
    description: t.string({ required: false }),
    status: t.field({
      type: EventStatus,
      required: false,
    }),
    visibility: t.field({
      type: EventVisibility,
      required: false,
    }),
    startDateTime: t.field({
      type: "DateTime",
      required: false,
    }),
    endDateTime: t.field({
      type: "DateTime",
      required: false,
    }),
    timeZone: t.string({ required: false }),
    latitude: t.string({ required: false }),
    longitude: t.string({ required: false }),
    address: t.string({ required: false }),
    meetingURL: t.string({ required: false }),
  }),
});

builder.mutationFields((t) => ({
  createEvent: t.field({
    description: "Create an event",
    type: EventRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: EventCreateInput, required: true }),
    },
    resolve: async (root, { input }, ctx) => {
      const {
        name,
        description,
        visibility,
        startDateTime,
        endDateTime,
        communityId,
        address,
        latitude,
        longitude,
        meetingURL,
        status,
        timeZone,
      } = input;

      if (!ctx.USER) {
        throw new GraphQLError("User not found");
      }

      if (!(await canCreateEvent(ctx.USER.id, communityId, ctx.DB))) {
        throw new GraphQLError("FORBIDDEN");
      }

      try {
        const result = await ctx.DB.transaction(async (trx) => {
          try {
            const newEvent = insertEventsSchema.parse({
              name,
              description,
              visibility,
              startDateTime,
              endDateTime,
              geoAddressJSON: address,
              geoLongitude: longitude,
              getLatitude: latitude,
              meetingURL,
              status: status ?? "inactive",
              timeZone,
            });

            const events = (
              await trx.insert(eventsSchema).values(newEvent).returning()
            )?.[0];

            await trx.insert(eventsToCommunitiesSchema).values({
              eventId: events.id,
              communityId: communityId,
            });

            return events;
          } catch (e) {
            trx.rollback();
            throw new GraphQLError(
              e instanceof Error ? e.message : "Unknown error",
            );
          }
        });

        return selectEventsSchema.parse(result);
      } catch (e) {
        throw new GraphQLError(
          "Could not create event. It might be that the community does not exist, or that there is already an event with that name.",
        );
      }
    },
  }),
  editEvent: t.field({
    description: "Edit an event",
    type: EventRef,
    nullable: false,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({ type: EventEditInput, required: true }),
    },
    resolve: async (root, { input }, ctx) => {
      try {
        const {
          eventId,
          name,
          description,
          visibility,
          startDateTime,
          endDateTime,
          address,
          latitude,
          longitude,
          meetingURL,
          status,
          timeZone,
        } = input;

        if (!ctx.USER) {
          throw new Error("User not found");
        }

        if (!(await canEditEvent(ctx.USER.id, eventId, ctx.DB))) {
          throw new Error("FORBIDDEN");
        }

        const updateValues = updateEventsSchema.safeParse({
          name,
          description,
          visibility,
          startDateTime,
          endDateTime,
          geoAddressJSON: address,
          geoLongitude: longitude,
          geoLatitude: latitude,
          meetingURL,
          status,
          timeZone,
        });

        if (!updateValues.success) {
          throw new Error("Invalid input");
        }

        const event = (
          await ctx.DB.update(eventsSchema)
            .set(updateValues.data)
            .where(eq(eventsSchema.id, eventId))
            .returning()
        )?.[0];

        return selectEventsSchema.parse(event);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
}));
