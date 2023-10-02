import { inArray } from "drizzle-orm";
import { ORM_TYPE } from "~/datasources/db";
import { EventStatus } from "~/generated/types";

export type UserRoleEvent = "admin" | "member" | "collaborator";
export type UserRoleCommunity = "admin" | "member" | "volunteer";

export async function eventIsActive(
  eventId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const event = await DB.query.eventsSchema.findFirst({
    where: (t, { eq }) => eq(t.id, eventId),
  });

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
  if (user?.isSuperAdmin) return true;
  const isCommunityAdmin = await DB.query.usersToCommunitiesSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(
        eq(utc.userId, userId),
        eq(utc.role, "admin"),
        eq(utc.communityId, communityId),
      ),
  });

  return Boolean(isCommunityAdmin);
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
  if (user?.isSuperAdmin) return true;

  const userTicket = await DB.query.userTicketsSchema.findFirst({
    where: (utc, { eq }) => eq(utc.id, userTicketId),
    with: {
      ticketTemplate: true,
    },
  });

  if (!userTicket) return false;
  if (userId === userTicket.userId) return true;

  const community = await DB.query.eventsToCommunitiesSchema.findFirst({
    where: (utc, { eq }) => eq(utc.eventId, userTicket?.ticketTemplate.eventId),
  });

  if (!community) return false;

  const isCommunityAdmin = await DB.query.usersToCommunitiesSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(
        eq(utc.communityId, community.communityId),
        eq(utc.userId, userId),
        eq(utc.role, "admin"),
      ),
  });

  return Boolean(isCommunityAdmin);
}

export async function canApproveTicket(
  userId: string,
  userTicketId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const user = await DB.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });
  if (user?.isSuperAdmin) return true;

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
  if (user?.isSuperAdmin) return true;

  const isCommunityAdmin = await DB.query.usersToCommunitiesSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(
        eq(utc.userId, userId),
        eq(utc.role, "admin"),
        eq(utc.communityId, communityId),
      ),
  });

  return Boolean(isCommunityAdmin);
}

export async function canEditTicket(
  userId: string,
  ticketId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const user = await DB.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });
  if (user?.isSuperAdmin) return true;

  const ticket = await DB.query.ticketsSchema.findFirst({
    where: (t, { eq }) => eq(t.id, ticketId),
  });
  if (!ticket) return false;
  const eventToCommunitie = await DB.query.eventsToCommunitiesSchema.findFirst({
    where: (utc, { eq }) => eq(utc.eventId, ticket?.eventId),
  });
  if (!eventToCommunitie) return false;
  const isCommunityAdmin = await DB.query.usersToCommunitiesSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(
        eq(utc.userId, userId),
        eq(utc.role, "admin"),
        eq(utc.communityId, eventToCommunitie?.communityId),
      ),
  });
  return Boolean(isCommunityAdmin);
}

export async function canRedeemUserTicket(
  userId: string,
  ticketId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  const user = await DB.query.usersSchema.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });
  if (user?.isSuperAdmin) return true;
  const userTicket = await DB.query.userTicketsSchema.findFirst({
    where: (utc, { eq }) => eq(utc.id, ticketId),
    with: {
      ticketTemplate: true,
    },
  });
  if (!userTicket) return false;
  const eventToCommunitie = await DB.query.eventsToCommunitiesSchema.findFirst({
    where: (utc, { eq }) => eq(utc.eventId, userTicket?.ticketTemplate.eventId),
  });
  if (!eventToCommunitie) return false;

  const isCommunityAdminOrVolunteer =
    await DB.query.usersToCommunitiesSchema.findFirst({
      where: (utc, { eq, and }) =>
        and(
          eq(utc.userId, userId),
          eq(utc.communityId, eventToCommunitie?.communityId),
          inArray(utc.role, ["admin", "volunteer"]),
        ),
    });

  return Boolean(isCommunityAdminOrVolunteer);
}
