import { inArray } from "drizzle-orm";
import { z } from "zod";

import { ORM_TYPE } from "~/datasources/db";
import { selectUsersSchema } from "~/datasources/db/users";
import { EventStatus } from "~/generated/types";
import { eventsFetcher } from "~/schema/events/eventsFetcher";

export type UserRoleEvent = "admin" | "member" | "collaborator";
export type UserRoleCommunity = "admin" | "member" | "collaborator";

export async function isEventActive(
  eventId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const events = await eventsFetcher.searchEvents({
    DB,
    search: {
      eventIds: [eventId],
    },
  });

  const event = events[0];

  return event?.status === EventStatus.Active;
}

export async function hasUserRoleInEvent(
  eventId: string,
  userId: string,
  role: UserRoleEvent,
  DB: ORM_TYPE,
): Promise<boolean> {
  const hasRoleInEvent = await DB.query.eventsToUsersSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(eq(utc.eventId, eventId), eq(utc.userId, userId), eq(utc.role, role)),
  });

  return Boolean(hasRoleInEvent);
}

export async function hasUserRoleInCommunity(
  communityId: string,
  userId: string,
  role: UserRoleCommunity,
  DB: ORM_TYPE,
): Promise<boolean> {
  const hasRoleInCommunity = await DB.query.usersToCommunitiesSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(
        eq(utc.communityId, communityId),
        eq(utc.userId, userId),
        eq(utc.role, role),
      ),
  });

  return Boolean(hasRoleInCommunity);
}

export async function canCreateEvent(
  userId: string,
  communityId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const user = await DB.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (user?.isSuperAdmin) {
    return true;
  }

  const communityAdmin = await isCommunityAdmin({
    userId,
    communityId,
    DB,
  });

  return Boolean(communityAdmin);
}
export async function canEditEvent(
  userId: string,
  eventId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const user = await DB.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (user?.isSuperAdmin) {
    return true;
  }

  const eventsToCommunities =
    await DB.query.eventsToCommunitiesSchema.findFirst({
      where: (utc, { eq }) => eq(utc.eventId, eventId),
    });

  if (!eventsToCommunities) {
    return false;
  }

  const communityAdmin = await isCommunityAdmin({
    userId,
    communityId: eventsToCommunities.communityId,
    DB,
  });

  return Boolean(communityAdmin);
}

export function isSameUser(userId: string, targetUserId: string): boolean {
  return userId === targetUserId;
}

export async function canCancelUserTicket(
  userId: string,
  userTicketId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const user = await DB.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (user?.isSuperAdmin) {
    return true;
  }

  const userTicket = await DB.query.userTicketsSchema.findFirst({
    where: (utc, { eq }) => eq(utc.id, userTicketId),
    with: {
      ticketTemplate: true,
    },
  });

  if (!userTicket) {
    return false;
  }

  if (userId === userTicket.userId) {
    return true;
  }

  const community = await DB.query.eventsToCommunitiesSchema.findFirst({
    where: (utc, { eq }) => eq(utc.eventId, userTicket?.ticketTemplate.eventId),
  });

  if (!community) {
    return false;
  }

  const communityAdmin = await isCommunityAdmin({
    userId,
    communityId: community.id,
    DB,
  });

  return Boolean(communityAdmin);
}

export async function canApproveTicket(
  userId: string,
  userTicketId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const user = await DB.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (user?.isSuperAdmin) {
    return true;
  }

  const userTicket = await DB.query.userTicketsSchema.findFirst({
    where: (utc, { eq }) => eq(utc.id, userTicketId),
    with: {
      ticketTemplate: true,
    },
  });

  if (!userTicket || !userTicket.ticketTemplate) {
    return false;
  }

  const isEventAdmin = await DB.query.eventsToUsersSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(
        eq(utc.eventId, userTicket?.ticketTemplate.eventId),
        eq(utc.userId, userId),
        eq(utc.role, "admin"),
      ),
  });

  return Boolean(isEventAdmin);
}

export async function canUpdateUserRoleInCommunity(
  userId: string,
  communityId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const user = await DB.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (user?.isSuperAdmin) {
    return true;
  }

  const communityAdmin = await isCommunityAdmin({
    userId,
    communityId,
    DB,
  });

  return Boolean(communityAdmin);
}

export async function canCreateTicket({
  user,
  eventId,
  DB,
}: {
  user: z.infer<typeof selectUsersSchema>;
  eventId: string;
  DB: ORM_TYPE;
}): Promise<boolean> {
  if (user.isSuperAdmin) {
    return true;
  }

  const results = await DB.query.eventsToCommunitiesSchema.findFirst({
    where: (utc, { eq }) => eq(utc.eventId, eventId),
    with: {
      community: {
        with: {
          usersToCommunities: {
            where: (utc, { eq, and }) =>
              and(eq(utc.userId, user.id), eq(utc.role, "admin")),
          },
        },
      },
    },
  });
  const communityAdminAssignments =
    results?.community?.usersToCommunities.length ?? 0;
  const isEventAdmin = communityAdminAssignments > 0;

  return Boolean(isEventAdmin);
}

export async function canEditTicket(
  userId: string,
  ticketId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const user = await DB.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (user?.isSuperAdmin) {
    return true;
  }

  const ticket = await DB.query.ticketsSchema.findFirst({
    where: (t, { eq }) => eq(t.id, ticketId),
  });

  if (!ticket) {
    return false;
  }

  const eventToCommunity = await DB.query.eventsToCommunitiesSchema.findFirst({
    where: (utc, { eq }) => eq(utc.eventId, ticket?.eventId),
  });

  if (!eventToCommunity) {
    return false;
  }

  const communityAdmin = await isCommunityAdmin({
    userId,
    communityId: eventToCommunity?.communityId,
    DB,
  });

  return Boolean(communityAdmin);
}

export async function canRedeemUserTicket(
  userId: string,
  ticketId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const user = await DB.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (user?.isSuperAdmin) {
    return true;
  }

  const userTicket = await DB.query.userTicketsSchema.findFirst({
    where: (utc, { eq }) => eq(utc.id, ticketId),
    with: {
      ticketTemplate: true,
    },
  });

  if (!userTicket) {
    return false;
  }

  const eventToCommunitie = await DB.query.eventsToCommunitiesSchema.findFirst({
    where: (utc, { eq }) => eq(utc.eventId, userTicket?.ticketTemplate.eventId),
  });

  if (!eventToCommunitie) {
    return false;
  }

  const isCommunityAdminOrCollaborator =
    await DB.query.usersToCommunitiesSchema.findFirst({
      where: (utc, { eq, and }) =>
        and(
          eq(utc.userId, userId),
          eq(utc.communityId, eventToCommunitie?.communityId),
          inArray(utc.role, ["admin", "collaborator"]),
        ),
    });
  const isEventAdminOrCollaborator =
    await DB.query.eventsToUsersSchema.findFirst({
      where: (utc, { eq, and }) =>
        and(
          eq(utc.userId, userId),
          eq(utc.eventId, userTicket?.ticketTemplate.eventId),
          inArray(utc.role, ["admin", "collaborator"]),
        ),
    });

  return Boolean(isCommunityAdminOrCollaborator || isEventAdminOrCollaborator);
}
export function canCreateCommunity(
  user: z.infer<typeof selectUsersSchema> | null,
): boolean {
  if (!user) {
    return false;
  }

  return user.isSuperAdmin || false;
}
export async function canEditCommunity(
  user: z.infer<typeof selectUsersSchema> | null,
  communityId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (user.isSuperAdmin) {
    return true;
  }

  const communityAdmin = await isCommunityAdmin({
    userId: user.id,
    communityId,
    DB,
  });

  return Boolean(communityAdmin);
}

const isCommunityAdmin = async ({
  userId,
  communityId,
  DB,
}: {
  userId: string;
  communityId: string;
  DB: ORM_TYPE;
}) => {
  const isCommunityAdmin = await DB.query.usersToCommunitiesSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(
        eq(utc.userId, userId),
        eq(utc.role, "admin"),
        eq(utc.communityId, communityId),
      ),
  });

  return Boolean(isCommunityAdmin);
};
