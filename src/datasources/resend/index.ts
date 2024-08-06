import { eq } from "drizzle-orm";
import { Resend } from "resend";

import { ORM_TYPE } from "~/datasources/db";
import {
  communitySchema,
  selectCommunitySchema,
  updateCommunitySchema,
} from "~/datasources/db/communities";
import {
  eventsSchema,
  selectEventsSchema,
  updateEventsSchema,
} from "~/datasources/db/events";
import {
  selectTeamsSchema,
  teamsSchema,
  updateTeamsSchema,
} from "~/datasources/db/teams";
import {
  selectTicketSchema,
  ticketsSchema,
  updateTicketSchema,
} from "~/datasources/db/tickets";

const ensureEventAudience = async ({
  DB,
  resend,
  event,
}: {
  DB: ORM_TYPE;
  resend: Resend;
  event: typeof selectEventsSchema._type;
}) => {
  if (event.resendAudienceId) {
    return;
  }

  const audience = await resend.audiences.create({
    name: `Event - ${event.name}`,
  });

  if (!audience.data) {
    throw new Error("Failed to create audience");
  }

  const parsedData = updateEventsSchema.parse({
    resendAudienceId: audience.data.id,
  });

  await DB.update(eventsSchema)
    .set(parsedData)
    .where(eq(eventsSchema.id, event.id));
};

const ensureTicketAudience = async ({
  DB,
  resend,
  ticket,
}: {
  DB: ORM_TYPE;
  resend: Resend;
  ticket: typeof selectTicketSchema._type;
}) => {
  if (ticket.resendAudienceId) {
    return;
  }

  const audience = await resend.audiences.create({
    name: `Ticket - ${ticket.name}`,
  });

  if (!audience.data) {
    throw new Error("Failed to create audience");
  }

  const parsedData = updateTicketSchema.parse({
    resendAudienceId: audience.data.id,
  });

  await DB.update(ticketsSchema)
    .set(parsedData)
    .where(eq(ticketsSchema.id, ticket.id));
};

const ensureCommunityAudience = async ({
  DB,
  resend,
  community,
}: {
  DB: ORM_TYPE;
  resend: Resend;
  community: typeof selectCommunitySchema._type;
}) => {
  if (community.resendAudienceId) {
    return;
  }

  const audience = await resend.audiences.create({
    name: `Community - ${community.name}`,
  });

  if (!audience.data) {
    throw new Error("Failed to create audience");
  }

  const parsedData = updateCommunitySchema.parse({
    resendAudienceId: audience.data.id,
  });

  await DB.update(communitySchema)
    .set(parsedData)
    .where(eq(communitySchema.id, community.id));
};

const ensureTeamsAudience = async ({
  DB,
  resend,
  team,
}: {
  DB: ORM_TYPE;
  resend: Resend;
  team: typeof selectTeamsSchema._type;
}) => {
  if (team.resendAudienceId) {
    return;
  }

  const audience = await resend.audiences.create({
    name: `Team - ${team.name}`,
  });

  if (!audience.data) {
    throw new Error("Failed to create audience");
  }

  const parsedData = updateTeamsSchema.parse({
    resendAudienceId: audience.data.id,
  });

  await DB.update(teamsSchema)
    .set(parsedData)
    .where(eq(teamsSchema.id, team.id));
};

export const resendAudiences = {
  ensureEventAudience,
  ensureTicketAudience,
  ensureCommunityAudience,
  ensureTeamsAudience,
};
