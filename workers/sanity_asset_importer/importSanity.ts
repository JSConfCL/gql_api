/* eslint-disable no-console */
import { H } from "@highlight-run/cloudflare";
import { createClient } from "@sanity/client";
import { ENV } from "./types";
import { SanityEvent } from "../../src/datasources/sanity/types";
import { getDb } from "../../src/datasources/db";
import { eventsSchema } from "../../src/datasources/db/events";
import { eventsToCommunitiesSchema } from "../../src/datasources/db/eventsCommunities";

const getSanityClient = (env: ENV) =>
  createClient({
    projectId: env.SANITY_PROJECT_ID,
    dataset: env.SANITY_DATASET,
    useCdn: false, // `false` if you want to ensure fresh data
    apiVersion: env.SANITY_API_VERSION, // use current date (YYYY-MM-DD) to target the latest API version
    token: env.SANITY_SECRET_TOKEN, // Only if you want to update content with the client
  });

export const importFromSanity = async (env: ENV) => {
  try {
    const DB = getDb({
      neonUrl: env.NEON_URL,
    });

    const sanityClient = getSanityClient(env);
    const events = await sanityClient.fetch<SanityEvent[]>(
      // "*[_type == 'event']{title, url, startDate, endDate, _id, image, project->{_id, title, image}}",
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
      console.error("JavaScript Community not found");
      return;
    }
    let i = 0;
    for (const event of events) {
      i++;
      console.log("Finding event", event);
      const foundEvent = await DB.query.eventsSchema.findFirst({
        where: (e, { eq }) => eq(eventsSchema.sanityEventId, event._id),
      });
      if (!foundEvent) {
        console.log("Inserting event", event._id);

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
          console.error("Failed to insert event");
        } else {
          await DB.insert(eventsToCommunitiesSchema).values({
            eventId: insertedEvent.id,
            communityId: community.id,
          });
        }
      } else {
        console.log("Event already exists", event._id);
      }
    }
  } catch (e) {
    console.error(e);
    H.consumeError(e as Error);
    throw e;
  }
};
