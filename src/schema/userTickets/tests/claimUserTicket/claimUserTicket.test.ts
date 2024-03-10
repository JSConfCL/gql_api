import { it, describe, assert } from "vitest";
import {
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertTicketTemplate,
  insertUser,
  insertUserToCommunity,
} from "~/tests/__fixtures";
import {
  ClaimUserTicket,
  ClaimUserTicketMutation,
  ClaimUserTicketMutationVariables,
} from "./claimUserTicket.generated";
import { AsyncReturnType } from "type-fest";

const createCommunityEventUserAndTicketTemplate = async ({
  community,
  event,
  user,
  ticketTemplate,
}: {
  community?: AsyncReturnType<typeof insertCommunity>;
  event?: AsyncReturnType<typeof insertEvent>;
  user?: AsyncReturnType<typeof insertUser>;
  ticketTemplate?: AsyncReturnType<typeof insertTicketTemplate>;
} = {}) => {
  const createdCommunity = community ?? (await insertCommunity());
  const createdEvent =
    event ??
    (await insertEvent({
      maxAttendees: 40,
    }));
  await insertEventToCommunity({
    eventId: createdEvent.id,
    communityId: createdCommunity.id,
  });
  const createdUser = user ?? (await insertUser());

  const createdTicketTemplate =
    ticketTemplate ??
    (await insertTicketTemplate({
      eventId: createdEvent.id,
      quantity: 100,
    }));

  return {
    community: createdCommunity,
    event: createdEvent,
    user: createdUser,
    ticketTemplate: createdTicketTemplate,
  };
};

describe("Claim a user ticket", () => {
  describe("Should work", () => {
    it("By default for a single user", async () => {
      const { community, user, ticketTemplate } =
        await createCommunityEventUserAndTicketTemplate();
      await insertUserToCommunity({
        communityId: community.id,
        userId: user.id,
        role: "admin",
      });
      const response = await executeGraphqlOperationAsUser<
        ClaimUserTicketMutation,
        ClaimUserTicketMutationVariables
      >(
        {
          document: ClaimUserTicket,
          variables: {
            input: {
              purchaseOrder: [
                {
                  ticketId: ticketTemplate.id,
                  quantity: 2,
                },
                {
                  ticketId: ticketTemplate.id,
                  quantity: 1,
                },
              ],
            },
          },
        },
        user,
      );
      assert.equal(response.errors, undefined);
      assert.equal(response.data?.claimUserTicket?.length, 3);
    });
  });
});
