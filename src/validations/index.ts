import { inArray } from "drizzle-orm";
import { z } from "zod";

import { isAdminOfEventCommunity, isCommunityAdmin } from "~/authz/helpers";
import { ORM_TYPE } from "~/datasources/db";
import { selectUsersSchema, USER } from "~/datasources/db/users";
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
  user: Pick<USER, "id" | "isSuperAdmin">,
  role: UserRoleEvent,
  DB: ORM_TYPE,
): Promise<boolean> {
  const hasRoleInEvent = await DB.query.eventsToUsersSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(
        eq(utc.eventId, eventId),
        eq(utc.userId, user.id),
        eq(utc.role, role),
      ),
  });

  return Boolean(hasRoleInEvent);
}

export async function hasUserRoleInCommunity(
  communityId: string,
  user: Pick<USER, "id" | "isSuperAdmin">,
  role: UserRoleCommunity,
  DB: ORM_TYPE,
): Promise<boolean> {
  const hasRoleInCommunity = await DB.query.usersToCommunitiesSchema.findFirst({
    where: (utc, { eq, and }) =>
      and(
        eq(utc.communityId, communityId),
        eq(utc.userId, user.id),
        eq(utc.role, role),
      ),
  });

  return Boolean(hasRoleInCommunity);
}

export async function canCreateEvent(
  user: Pick<USER, "id" | "isSuperAdmin">,
  communityId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
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

export async function canEditEvent(
  user: Pick<USER, "id" | "isSuperAdmin">,
  eventId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  if (user.isSuperAdmin) {
    return true;
  }

  const communityAdmin = await isAdminOfEventCommunity({
    userId: user.id,
    eventId: eventId,
    DB,
  });

  return Boolean(communityAdmin);
}

export function isSameUser(userId: string, targetUserId: string): boolean {
  return userId === targetUserId;
}

export async function canCancelUserTicket(
  user: Pick<USER, "id" | "isSuperAdmin">,
  userTicketId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  if (user.isSuperAdmin) {
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

  if (user.id === userTicket.userId) {
    return true;
  }

  const communityAdmin = await isAdminOfEventCommunity({
    userId: user.id,
    eventId: userTicket.ticketTemplate.eventId,
    DB,
  });

  return Boolean(communityAdmin);
}

export async function canApproveTicket(
  user: Pick<USER, "id" | "isSuperAdmin">,
  userTicketId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  if (user.isSuperAdmin) {
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
        eq(utc.userId, user.id),
        eq(utc.role, "admin"),
      ),
  });

  return Boolean(isEventAdmin);
}

export async function canUpdateUserRoleInCommunity(
  user: Pick<USER, "id" | "isSuperAdmin">,
  communityId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
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
  user: Pick<USER, "id" | "isSuperAdmin">,
  ticketId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  if (user.isSuperAdmin) {
    return true;
  }

  const ticket = await DB.query.ticketsSchema.findFirst({
    where: (t, { eq }) => eq(t.id, ticketId),
  });

  if (!ticket) {
    return false;
  }

  const communityAdmin = await isAdminOfEventCommunity({
    userId: user.id,
    eventId: ticket?.eventId,
    DB,
  });

  return Boolean(communityAdmin);
}

export async function canRedeemUserTicket(
  user: Pick<USER, "id" | "isSuperAdmin">,
  ticketId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
  if (user.isSuperAdmin) {
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

  const eventToCommunity = await DB.query.eventsToCommunitiesSchema.findFirst({
    where: (utc, { eq }) => eq(utc.eventId, userTicket?.ticketTemplate.eventId),
  });

  if (!eventToCommunity) {
    return false;
  }

  const isCommunityAdminOrCollaborator =
    await DB.query.usersToCommunitiesSchema.findFirst({
      where: (utc, { eq, and }) =>
        and(
          eq(utc.userId, user.id),
          eq(utc.communityId, eventToCommunity?.communityId),
          inArray(utc.role, ["admin", "collaborator"]),
        ),
    });
  const isEventAdminOrCollaborator =
    await DB.query.eventsToUsersSchema.findFirst({
      where: (utc, { eq, and }) =>
        and(
          eq(utc.userId, user.id),
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
  user: z.infer<typeof selectUsersSchema>,
  communityId: string,
  DB: ORM_TYPE,
): Promise<boolean> {
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
