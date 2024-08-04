import { v4 } from "uuid";
import { it, describe, assert } from "vitest";

import {
  UserParticipationStatusEnum,
  UserTeamRoleEnum,
} from "~/datasources/db/userTeams";
import { UserTicketsApprovalStatusEnum } from "~/datasources/db/userTickets";
import {
  EventStatus,
  EventVisibility,
  ParticipationStatus,
  PurchaseOrderPaymentStatusEnum,
  TicketApprovalStatus,
  TicketPaymentStatus,
  TicketRedemptionStatus,
  UserTeamRole,
} from "~/generated/types";
import {
  executeGraphqlOperation,
  insertEvent,
  insertTag,
  insertEventTag,
  insertCommunity,
  insertEventToCommunity,
  insertTicketTemplate,
  insertUser,
  insertTicket,
  executeGraphqlOperationAsSuperAdmin,
  insertUserToCommunity,
  insertUserToEvent,
  executeGraphqlOperationAsUser,
  toISODate,
  insertPurchaseOrder,
  insertTeam,
  insertUserTeams,
} from "~/tests/fixtures";

import { Event, EventQuery, EventQueryVariables } from "./event.generated";
import { Events, EventsQuery, EventsQueryVariables } from "./events.generated";

describe("Event", () => {
  it("Should find an event by ID", async () => {
    const event1 = await insertEvent();
    const response = await executeGraphqlOperationAsSuperAdmin<
      EventQuery,
      EventQueryVariables
    >({
      document: Event,
      variables: {
        eventId: event1.id,
        eventTickets: {},
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.event, {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: EventStatus.Active,
      visibility: EventVisibility.Public,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
      community: null,
      tags: [],
      teams: [],
      users: [],
      usersTickets: [],
    } satisfies EventQuery["event"]);
  });
  it("Should get an event Tags", async () => {
    const event1 = await insertEvent();
    const tag1 = await insertTag({
      name: "TAG 1",
    });
    const tag2 = await insertTag({
      name: "ZTAG 2",
    });

    await insertEventTag({
      eventId: event1.id,
      tagId: tag1.id,
    });
    await insertEventTag({
      eventId: event1.id,
      tagId: tag2.id,
    });
    const response = await executeGraphqlOperationAsSuperAdmin<
      EventQuery,
      EventQueryVariables
    >({
      document: Event,
      variables: {
        eventId: event1.id,
        eventTickets: {},
      },
    });

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.event?.tags?.length, 2);
    assert.deepEqual(response.data?.event, {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: EventStatus.Active,
      visibility: EventVisibility.Public,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
      community: null,
      users: [],
      teams: [],
      tags: [
        {
          id: tag2.id,
        },
        {
          id: tag1.id,
        },
      ],
      usersTickets: [],
    } satisfies EventQuery["event"]);
  });
  it("a user should get only their own event tickets", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();
    const user2 = await insertUser();

    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const purchaseOrder = await insertPurchaseOrder();
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Approved,
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Cancelled,
    });
    await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Pending,
    });
    const ticket2 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: UserTicketsApprovalStatusEnum.NotRequired,
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user2.id,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Approved,
    });
    const response = await executeGraphqlOperationAsUser<
      EventQuery,
      EventQueryVariables
    >(
      {
        document: Event,
        variables: {
          eventId: event1.id,
          eventTickets: {},
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.event?.usersTickets?.length, 2);
    assert.deepEqual(response.data?.event, {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: EventStatus.Active,
      visibility: EventVisibility.Public,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
      community: {
        id: community1.id,
      },
      users: [
        {
          id: user1.id,
        },
      ],
      tags: [],
      teams: [],
      usersTickets: [
        {
          id: ticket2.id,
          approvalStatus: TicketApprovalStatus.NotRequired,
          paymentStatus: PurchaseOrderPaymentStatusEnum.Unpaid,
          redemptionStatus: TicketRedemptionStatus.Pending,
          createdAt: toISODate(ticket2.createdAt),
        },
        {
          id: ticket1.id,
          approvalStatus: TicketApprovalStatus.Approved,
          paymentStatus: PurchaseOrderPaymentStatusEnum.Unpaid,
          redemptionStatus: TicketRedemptionStatus.Pending,
          createdAt: toISODate(ticket1.createdAt),
        },
      ],
    } satisfies EventQuery["event"]);
  });
  it("Should get an event community", async () => {
    const event1 = await insertEvent();
    const community1 = await insertCommunity();

    await insertEventToCommunity({
      communityId: community1.id,
      eventId: event1.id,
    });
    const response = await executeGraphqlOperationAsSuperAdmin<
      EventQuery,
      EventQueryVariables
    >({
      document: Event,
      variables: {
        eventId: event1.id,
        eventTickets: {},
      },
    });

    assert.equal(response.errors, undefined);
    assert.notEqual(response.data?.event?.community, null);
    assert.deepEqual(response.data?.event, {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: EventStatus.Active,
      visibility: EventVisibility.Public,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
      users: [],
      community: {
        id: community1.id,
      },
      tags: [],
      teams: [],
      usersTickets: [],
    } satisfies EventQuery["event"]);
  });
  it("Should get an event users", async () => {
    const event1 = await insertEvent();
    const response = await executeGraphqlOperationAsSuperAdmin<
      EventQuery,
      EventQueryVariables
    >({
      document: Event,
      variables: {
        eventId: event1.id,
        eventTickets: {},
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.event, {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: EventStatus.Active,
      visibility: EventVisibility.Public,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
      users: [],
      community: null,
      tags: [],
      teams: [],
      usersTickets: [],
    } satisfies EventQuery["event"]);
  });
  it("return null when no event  is found", async () => {
    const response = await executeGraphqlOperationAsSuperAdmin<
      EventQuery,
      EventQueryVariables
    >({
      document: Event,
      variables: {
        eventId: v4(),
        eventTickets: {},
      },
    });

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.event, null);
  });
});

describe("Event Teams", () => {
  it("Should get an event teams", async () => {
    const event1 = await insertEvent();
    const user = await insertUser();
    const team = await insertTeam({
      eventId: event1.id,
    });

    await insertUserTeams({
      teamId: team.id,
      userId: user.id,
      userParticipationStatus: UserParticipationStatusEnum.accepted,
      role: UserTeamRoleEnum.leader,
    });
    const response = await executeGraphqlOperationAsSuperAdmin<
      EventQuery,
      EventQueryVariables
    >({
      document: Event,
      variables: {
        eventId: event1.id,
        eventTickets: {},
      },
    });

    assert.equal(response.errors, undefined);

    if (!response.data?.event?.teams) {
      throw new Error("Event teams not found");
    }

    assert.deepEqual(response.data?.event?.teams?.length, 1);
    assert.deepEqual(response.data?.event?.teams?.at(0), {
      id: team.id,
      users: [
        {
          id: user.id,
          user: {
            id: user.id,
          },
          status: ParticipationStatus.Accepted,
          role: UserTeamRole.Leader,
        },
      ],
    });

    const leaderResponse = await executeGraphqlOperationAsUser<
      EventQuery,
      EventQueryVariables
    >(
      {
        document: Event,
        variables: {
          eventId: event1.id,
          eventTickets: {},
        },
      },
      user,
    );

    assert.equal(leaderResponse.errors, undefined);
    assert.deepEqual(leaderResponse.data?.event?.teams, []);

    const anyOtherUserResponse = await executeGraphqlOperationAsUser<
      EventQuery,
      EventQueryVariables
    >(
      {
        document: Event,
        variables: {
          eventId: event1.id,
          eventTickets: {},
        },
      },
      user,
    );

    assert.equal(anyOtherUserResponse.errors, undefined);
    assert.deepEqual(leaderResponse.data?.event?.teams, []);
  });
});

describe("Events", () => {
  it("Should get a list of events with a default query", async () => {
    const event1 = await insertEvent({
      name: "MY CONFERENCE 1",
      startDateTime: new Date("2021-02-02"),
    });
    const event2 = await insertEvent({
      name: "MY MEETUP 2",
      startDateTime: new Date("2022-02-02"),
    });
    const event3 = await insertEvent({
      name: "MY MEETTUP 3",
      createdAt: new Date("2023-02-02"),
    });
    const response = await executeGraphqlOperation<
      EventsQuery,
      EventsQueryVariables
    >({
      document: Events,
      variables: {
        input: {},
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.searchEvents.data?.length, 3);
    assert.deepEqual(response.data?.searchEvents.data?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
    } as EventsQuery["searchEvents"]["data"][0]);
    assert.deepEqual(response.data?.searchEvents.data?.at(1), {
      id: event2.id,
      name: event2.name,
      description: event2.description,
      status: event2.status,
      visibility: event2.visibility,
      startDateTime: toISODate(event2.startDateTime),
      endDateTime: toISODate(event2.endDateTime),
    } as EventsQuery["searchEvents"]["data"][0]);
    assert.deepEqual(response.data?.searchEvents.data?.at(2), {
      id: event3.id,
      name: event3.name,
      description: event3.description,
      status: event3.status,
      visibility: event3.visibility,
      startDateTime: toISODate(event3.startDateTime),
      endDateTime: toISODate(event3.endDateTime),
    } as EventsQuery["searchEvents"]["data"][0]);
  });
  it("Should Filter by ID", async () => {
    const event1 = await insertEvent({
      name: "MY CONFERENCE 1",
    });

    await insertEvent({
      name: "MY MEETUP 2",
    });
    await insertEvent({
      name: "MY MEETTUP 3",
    });
    const response = await executeGraphqlOperationAsSuperAdmin<
      EventsQuery,
      EventsQueryVariables
    >({
      document: Events,
      variables: {
        input: {
          search: {
            id: event1.id,
          },
        },
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.searchEvents.data?.length, 1);
    assert.deepEqual(response.data?.searchEvents.data?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
    } as EventsQuery["searchEvents"]["data"][0]);
  });

  it("Should Filter by events that the user has purchased tickets", async () => {
    const event1 = await insertEvent({
      name: "MY CONFERENCE 1",
    });
    const event2 = await insertEvent({
      name: "MY CONFERENCE 2",
    });

    await insertEvent({
      name: "MY CONFERENCE 3",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
    });

    const purchaseOrder = await insertPurchaseOrder();
    const user1 = await insertUser();

    const ticketTemplate2 = await insertTicketTemplate({
      eventId: event2.id,
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Approved,
    });

    const purchaseOrder2 = await insertPurchaseOrder();

    await insertTicket({
      ticketTemplateId: ticketTemplate2.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder2.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Cancelled,
    });

    await insertEvent({
      name: "MY MEETUP 2",
    });
    await insertEvent({
      name: "MY MEETUP 3",
    });
    const response = await executeGraphqlOperationAsUser<
      EventsQuery,
      EventsQueryVariables
    >(
      {
        document: Events,
        variables: {
          input: {
            search: {
              userHasTickets: true,
            },
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.searchEvents.data?.length, 1);
    assert.deepEqual(response.data?.searchEvents.data?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
    } as EventsQuery["searchEvents"]["data"][0]);
  });
  it("Should Filter by Visibility", async () => {
    const event1 = await insertEvent({
      visibility: "private",
    });

    await insertEvent({
      visibility: "unlisted",
    });
    await insertEvent({
      visibility: "public",
    });
    const response = await executeGraphqlOperation<
      EventsQuery,
      EventsQueryVariables
    >({
      document: Events,
      variables: {
        input: {
          search: {
            visibility: EventVisibility.Private,
          },
        },
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.searchEvents.data?.length, 1);
    assert.deepEqual(response.data?.searchEvents.data?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
    } as EventsQuery["searchEvents"]["data"][0]);
  });
  it("Should Filter by Status", async () => {
    const event1 = await insertEvent({
      status: EventStatus.Active,
    });

    await insertEvent({
      status: EventStatus.Inactive,
    });
    const response = await executeGraphqlOperationAsSuperAdmin<
      EventsQuery,
      EventsQueryVariables
    >({
      document: Events,
      variables: {
        input: {
          search: {
            status: EventStatus.Active,
          },
        },
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.searchEvents.data?.length, 1);
    assert.deepEqual(response.data?.searchEvents.data?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
    } as EventsQuery["searchEvents"]["data"][0]);
  });
  it("Should Filter by Date", async () => {
    const event1 = await insertEvent({
      startDateTime: new Date("2021-02-02"),
      endDateTime: new Date("2021-02-03"),
    });

    await insertEvent({
      startDateTime: new Date("2021-02-04"),
      endDateTime: new Date("2021-02-05"),
    });
    const response = await executeGraphqlOperation<
      EventsQuery,
      EventsQueryVariables
    >({
      document: Events,
      variables: {
        input: {
          search: {
            startDateTimeFrom: new Date("2021-02-02").toISOString(),
            startDateTimeTo: new Date("2021-02-03").toISOString(),
          },
        },
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.searchEvents.data?.length, 1);
    assert.deepEqual(response.data?.searchEvents.data?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
    } as EventsQuery["searchEvents"]["data"][0]);
  });
  it("Should Filter by Name", async () => {
    const event1 = await insertEvent({
      name: "MY CONFERENCE 1",
    });

    await insertEvent({
      name: "SOME OTHER NAME",
    });
    const response = await executeGraphqlOperationAsSuperAdmin<
      EventsQuery,
      EventsQueryVariables
    >({
      document: Events,
      variables: {
        input: {
          search: {
            name: "CONFERENCE",
          },
        },
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.searchEvents.data?.length, 1);
    assert.deepEqual(response.data?.searchEvents.data?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
    } as EventsQuery["searchEvents"]["data"][0]);
  });
});
//Event tickets filter test
describe("Event tickets filter", () => {
  it("Should filter event ticket by id", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();

    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const purchaseOrder = await insertPurchaseOrder();
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Approved,
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
    });
    const response = await executeGraphqlOperationAsUser<
      EventQuery,
      EventQueryVariables
    >(
      {
        document: Event,
        variables: {
          eventId: event1.id,
          eventTickets: {
            id: ticket1.id,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.event?.usersTickets.length, 1);
    assert.deepEqual(response.data?.event, {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: EventStatus.Active,
      visibility: EventVisibility.Public,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
      community: {
        id: community1.id,
      },
      tags: [],
      teams: [],
      users: [
        {
          id: user1.id,
        },
      ],
      usersTickets: [
        {
          id: ticket1.id,

          approvalStatus: TicketApprovalStatus.Approved,
          paymentStatus: PurchaseOrderPaymentStatusEnum.Unpaid,
          redemptionStatus: TicketRedemptionStatus.Pending,
          createdAt: toISODate(ticket1.createdAt),
        },
      ],
    } satisfies EventQuery["event"]);
  });

  it("Should filter event ticket by approval status", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();

    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const purchaseOrder = await insertPurchaseOrder();
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Approved,
      purchaseOrderId: purchaseOrder.id,
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Pending,
      purchaseOrderId: purchaseOrder.id,
    });
    const response = await executeGraphqlOperationAsUser<
      EventQuery,
      EventQueryVariables
    >(
      {
        document: Event,
        variables: {
          eventId: event1.id,
          eventTickets: {
            approvalStatus: TicketApprovalStatus.Approved,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.event?.usersTickets.length, 1);
    assert.deepEqual(response.data?.event, {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: EventStatus.Active,
      visibility: EventVisibility.Public,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
      community: {
        id: community1.id,
      },
      tags: [],
      teams: [],
      users: [
        {
          id: user1.id,
        },
      ],
      usersTickets: [
        {
          id: ticket1.id,
          approvalStatus: TicketApprovalStatus.Approved,
          paymentStatus: PurchaseOrderPaymentStatusEnum.Unpaid,
          redemptionStatus: TicketRedemptionStatus.Pending,
          createdAt: toISODate(ticket1.createdAt),
        },
      ],
    } satisfies EventQuery["event"]);
  });

  it("Should filter event ticket by payment status", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();

    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const purchaseOrder = await insertPurchaseOrder({
      purchaseOrderPaymentStatus: TicketPaymentStatus.Paid,
    });
    const date1 = new Date("2021-02-02");
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Approved,
      createdAt: date1,
    });

    const date2 = new Date("2022-02-02");
    const ticket2 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Approved,
      createdAt: date2,
    });
    const response = await executeGraphqlOperationAsUser<
      EventQuery,
      EventQueryVariables
    >(
      {
        document: Event,
        variables: {
          eventId: event1.id,
          eventTickets: {
            paymentStatus: TicketPaymentStatus.Paid,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.event?.usersTickets.length, 2);
    assert.deepEqual(response.data?.event, {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: EventStatus.Active,
      visibility: EventVisibility.Public,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
      community: {
        id: community1.id,
      },
      tags: [],
      teams: [],
      users: [
        {
          id: user1.id,
        },
      ],
      usersTickets: [
        {
          id: ticket2.id,
          approvalStatus: TicketApprovalStatus.Approved,
          paymentStatus: PurchaseOrderPaymentStatusEnum.Paid,
          redemptionStatus: TicketRedemptionStatus.Pending,
          createdAt: toISODate(ticket2.createdAt),
        },
        {
          id: ticket1.id,
          approvalStatus: TicketApprovalStatus.Approved,
          paymentStatus: PurchaseOrderPaymentStatusEnum.Paid,
          redemptionStatus: TicketRedemptionStatus.Pending,
          createdAt: toISODate(ticket1.createdAt),
        },
      ],
    } satisfies EventQuery["event"]);
  });

  it("Should filter event ticket by redemption status", async () => {
    const community1 = await insertCommunity();
    const event1 = await insertEvent();

    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const user1 = await insertUser();

    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "admin",
    });
    await insertUserToEvent({
      eventId: event1.id,
      userId: user1.id,
      role: "admin",
    });
    const ticketTemplate1 = await insertTicketTemplate({
      eventId: event1.id,
    });
    const purchaseOrder = await insertPurchaseOrder();
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      redemptionStatus: TicketRedemptionStatus.Redeemed,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Approved,
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      redemptionStatus: TicketRedemptionStatus.Pending,
      purchaseOrderId: purchaseOrder.id,
      approvalStatus: UserTicketsApprovalStatusEnum.Approved,
    });
    const response = await executeGraphqlOperationAsUser<
      EventQuery,
      EventQueryVariables
    >(
      {
        document: Event,
        variables: {
          eventId: event1.id,
          eventTickets: {
            redemptionStatus: TicketRedemptionStatus.Redeemed,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.event?.usersTickets.length, 1);
    assert.deepEqual(response.data?.event, {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: EventStatus.Active,
      visibility: EventVisibility.Public,
      startDateTime: toISODate(event1.startDateTime),
      endDateTime: toISODate(event1.endDateTime),
      community: {
        id: community1.id,
      },
      tags: [],
      teams: [],
      users: [
        {
          id: user1.id,
        },
      ],
      usersTickets: [
        {
          id: ticket1.id,
          approvalStatus: TicketApprovalStatus.Approved,
          paymentStatus: PurchaseOrderPaymentStatusEnum.Unpaid,
          redemptionStatus: TicketRedemptionStatus.Redeemed,
          createdAt: toISODate(ticket1.createdAt),
        },
      ],
    } satisfies EventQuery["event"]);
  });
});
