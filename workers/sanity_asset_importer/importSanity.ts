import { getDb } from "~/datasources/db";
import { eventsSchema } from "~/datasources/db/events";
import { eventsToCommunitiesSchema } from "~/datasources/db/eventsCommunities";
import { getSanityClient } from "~/datasources/sanity/client";
import { SanityEvent } from "~/datasources/sanity/types";
import { Logger } from "~/logging";

import { ENV } from "./types";

export const importFromSanity = async (env: ENV, logger: Logger) => {
  try {
    const DB = getDb({
      neonUrl: env.NEON_URL,
      logger,
    });

    const sanityClient = getSanityClient({
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
      apiVersion: env.SANITY_API_VERSION,
      token: env.SANITY_SECRET_TOKEN,
      useCdn: true,
    });
    const events = await sanityClient.fetch<SanityEvent[]>(
      `*[_type == 'event']{
          title,
          url,
          startDate,
          endDate,
          _id,
          "imageUrl": image.asset->url,
          project->{
            _id,
            title,
            "imageUrl": image.asset->url,
          }
        }`,
    );

    const community = await DB.query.communitySchema.findFirst({
      where: (c, { eq }) => eq(c.slug, "jscl"),
    });

    if (!community) {
      logger.error("JavaScript Community not found");

      return;
    }

    let i = 0;

    for (const event of events) {
      i++;

      logger.info("Finding event", event);
      const foundEvent = await DB.query.eventsSchema.findFirst({
        where: (e, { eq }) => eq(eventsSchema.sanityEventId, event._id),
      });

      if (!foundEvent) {
        logger.info("Inserting event", event._id);

        const name = event.project?.title
          ? `${event.project?.title} - ${event.title}`
          : event.title;
        const insertedEvent = (
          await DB.insert(eventsSchema)
            .values({
              name,
              status: "inactive",
              visibility: "public",
              meetingURL: event.url,
              startDateTime: new Date(event.startDate),
              endDateTime: new Date(event.endDate),
              sanityEventId: event._id,
              bannerImageSanityRef: event.imageUrl || event.project?.imageUrl,
            })
            .onConflictDoUpdate({
              set: {
                name: `${name} ${i}`,
              },
              target: eventsSchema.name,
            })
            .returning()
        )?.[0];

        if (!insertedEvent) {
          logger.error("Failed to insert event");
        } else {
          await DB.insert(eventsToCommunitiesSchema).values({
            eventId: insertedEvent.id,
            communityId: community.id,
          });
        }
      } else {
        logger.warn("Event already exists", event._id);
      }
    }
  } catch (e) {
    logger.error(e as Error);
    throw e;
  }
};
