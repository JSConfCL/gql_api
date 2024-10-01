import { faker } from "@faker-js/faker";
import { it, describe, assert } from "vitest";

import { TeamStatusEnum } from "~/datasources/db/teams";
import { UserParticipationStatusEnum } from "~/datasources/db/userTeams";
import { UserTicketApprovalStatus } from "~/datasources/db/userTickets";
import {
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertPurchaseOrder,
  insertTicket,
  insertTicketTemplate,
  insertUser,
  insertUserData,
  insertTeam,
  insertUserTeams,
} from "~/tests/fixtures";

import {
  TriggerUserTicketApprovalReview,
  TriggerUserTicketApprovalReviewMutation,
  TriggerUserTicketApprovalReviewMutationVariables,
} from "./triggerUserTicketApprovalReview.generated";

const prepareTickets = async (
  status: UserTicketApprovalStatus = UserTicketApprovalStatus.Gifted,
  isTeamOnly = false,
) => {
  const community1 = await insertCommunity();
  const event1 = await insertEvent();

  await insertEventToCommunity({
    eventId: event1.id,
    communityId: community1.id,
  });
  const user1 = await insertUser();
  const ticketTemplate1 = await insertTicketTemplate({
    eventId: event1.id,
    tags: isTeamOnly ? ["hackathon"] : [],
  });
  const purchaseOrder = await insertPurchaseOrder();
  const ticket1 = await insertTicket({
    ticketTemplateId: ticketTemplate1.id,
    userId: user1.id,
    purchaseOrderId: purchaseOrder.id,
    approvalStatus: status,
  });

  return { ticket: ticket1, user: user1, event: event1 };
};

describe("triggerUserTicketApprovalReview mutation", () => {
  describe("It should approve tickets", () => {
    it("If data is complete for non-team tickets", async () => {
      const { event, user } = await prepareTickets(
        UserTicketApprovalStatus.Gifted,
        false,
      );

      await insertUserData({
        userId: user.id,
        rut: faker.random.alphaNumeric(10),
        countryOfResidence: "Chile",
        city: "Santiago",
      });

      const response = await executeGraphqlOperationAsUser<
        TriggerUserTicketApprovalReviewMutation,
        TriggerUserTicketApprovalReviewMutationVariables
      >(
        {
          document: TriggerUserTicketApprovalReview,
          variables: {
            eventId: event.id,
            userId: user.id,
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.triggerUserTicketApprovalReview.length, 1);
    });

    it("If data is complete for team tickets", async () => {
      const { event, user } = await prepareTickets(
        UserTicketApprovalStatus.Gifted,
        true,
      );
      const team = await insertTeam({
        eventId: event.id,
        teamStatus: TeamStatusEnum.accepted,
      });

      await insertUserTeams({
        userId: user.id,
        teamId: team.id,
        userParticipationStatus: UserParticipationStatusEnum.accepted,
      });

      await insertUserData({
        userId: user.id,
        rut: faker.random.alphaNumeric(10),
        countryOfResidence: "Chile",
        city: "Santiago",
        emergencyPhoneNumber: "123456789",
        foodAllergies: "None",
      });

      const response = await executeGraphqlOperationAsUser<
        TriggerUserTicketApprovalReviewMutation,
        TriggerUserTicketApprovalReviewMutationVariables
      >(
        {
          document: TriggerUserTicketApprovalReview,
          variables: {
            eventId: event.id,
            userId: user.id,
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.triggerUserTicketApprovalReview.length, 1);
    });
  });

  describe("It should not approve tickets", () => {
    it("If ticket is not gifted", async () => {
      const { event, user } = await prepareTickets(
        UserTicketApprovalStatus.Cancelled,
      );

      await insertUserData({
        userId: user.id,
        rut: faker.random.alphaNumeric(10),
        countryOfResidence: "Chile",
        city: "Santiago",
      });

      const response = await executeGraphqlOperationAsUser<
        TriggerUserTicketApprovalReviewMutation,
        TriggerUserTicketApprovalReviewMutationVariables
      >(
        {
          document: TriggerUserTicketApprovalReview,
          variables: {
            eventId: event.id,
            userId: user.id,
          },
        },
        user,
      );

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.triggerUserTicketApprovalReview.length, 0);
    });

    it("If data is incomplete for non-team tickets", async () => {
      const { event, user } = await prepareTickets(
        UserTicketApprovalStatus.Gifted,
        false,
      );

      await insertUserData({
        userId: user.id,
        rut: faker.random.alphaNumeric(10),
        // Missing countryOfResidence and city
      });

      const response = await executeGraphqlOperationAsUser<
        TriggerUserTicketApprovalReviewMutation,
        TriggerUserTicketApprovalReviewMutationVariables
      >(
        {
          document: TriggerUserTicketApprovalReview,
          variables: {
            eventId: event.id,
            userId: user.id,
          },
        },
        user,
      );

      assert.notEqual(response.errors, undefined);
    });

    it("If data is incomplete for team tickets", async () => {
      const { event, user } = await prepareTickets(
        UserTicketApprovalStatus.Gifted,
        true,
      );
      const team = await insertTeam({
        eventId: event.id,
        teamStatus: TeamStatusEnum.accepted,
      });

      await insertUserTeams({
        userId: user.id,
        teamId: team.id,
        userParticipationStatus: UserParticipationStatusEnum.accepted,
      });

      await insertUserData({
        userId: user.id,
        rut: faker.random.alphaNumeric(10),
        countryOfResidence: "Chile",
        city: "Santiago",
        // Missing emergencyPhoneNumber and foodAllergies
      });

      const response = await executeGraphqlOperationAsUser<
        TriggerUserTicketApprovalReviewMutation,
        TriggerUserTicketApprovalReviewMutationVariables
      >(
        {
          document: TriggerUserTicketApprovalReview,
          variables: {
            eventId: event.id,
            userId: user.id,
          },
        },
        user,
      );

      assert.notEqual(response.errors, undefined);
    });

    it("If team is not accepted for team tickets", async () => {
      const { event, user } = await prepareTickets(
        UserTicketApprovalStatus.Gifted,
        true,
      );
      const team = await insertTeam({
        eventId: event.id,
        teamStatus: TeamStatusEnum.not_accepted,
      });

      await insertUserTeams({
        userId: user.id,
        teamId: team.id,
        userParticipationStatus: UserParticipationStatusEnum.accepted,
      });

      await insertUserData({
        userId: user.id,
        rut: faker.random.alphaNumeric(10),
        countryOfResidence: "Chile",
        city: "Santiago",
        emergencyPhoneNumber: "123456789",
        foodAllergies: "None",
      });

      const response = await executeGraphqlOperationAsUser<
        TriggerUserTicketApprovalReviewMutation,
        TriggerUserTicketApprovalReviewMutationVariables
      >(
        {
          document: TriggerUserTicketApprovalReview,
          variables: {
            eventId: event.id,
            userId: user.id,
          },
        },
        user,
      );

      assert.notEqual(response.errors, undefined);
    });
  });
});
