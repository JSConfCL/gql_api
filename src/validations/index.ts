import { ORM_TYPE } from "~/datasources/db";
import { EventStatus } from "~/generated/types";

type UserRoleEvent = "admin" | "member" | "collaborator";
type UserRoleCommunity = "admin" | "member" | "volunteer";

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
