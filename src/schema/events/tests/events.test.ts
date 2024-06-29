import { v4 } from "uuid";
import { it, describe, assert } from "vitest";

import {
  EventStatus,
  EventVisibility,
  TicketApprovalStatus,
  TicketPaymentStatus,
  TicketRedemptionStatus,
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
  toISODateWithoutMilliseconds,
  insertPurchaseOrder,
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
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
      community: null,
      tags: [],
      users: [],
      usersTickets: [],
    } as EventQuery["event"]);
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
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
      community: null,
      users: [],
      tags: [
        {
          id: tag2.id,
        },
        {
          id: tag1.id,
        },
      ],
      usersTickets: [],
    } as EventQuery["event"]);
  });
  it("Should get an event tickets", async () => {
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
    });
    const ticket2 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user2.id,
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
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
      community: {
        id: community1.id,
      },
      users: [
        {
          id: user1.id,
        },
      ],
      tags: [],
      usersTickets: [
        {
          id: ticket1.id,
          approvalStatus: ticket1.approvalStatus,
          paymentStatus: ticket1.paymentStatus,
          redemptionStatus: ticket1.redemptionStatus,
        },
        {
          id: ticket2.id,
          approvalStatus: ticket2.approvalStatus,
          paymentStatus: ticket2.paymentStatus,
          redemptionStatus: ticket2.redemptionStatus,
        },
      ],
    } as EventQuery["event"]);
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
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
      users: [],
      community: {
        id: community1.id,
      },
      tags: [],
      usersTickets: [],
    } as EventQuery["event"]);
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
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
      users: [],
      community: null,
      tags: [],
      usersTickets: [],
    } as EventQuery["event"]);
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

describe("Events", () => {
  it("Should get a list of events with a default query", async () => {
    const event1 = await insertEvent({
      name: "MY CONFERENCE 1",
    });
    const event2 = await insertEvent({
      name: "MY MEETUP 2",
    });
    const event3 = await insertEvent({
      name: "MY MEETTUP 3",
    });
    const response = await executeGraphqlOperation<
      EventsQuery,
      EventsQueryVariables
    >({
      document: Events,
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.events?.length, 3);
    assert.deepEqual(response.data?.events?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
    } as EventsQuery["events"][0]);
    assert.deepEqual(response.data?.events?.at(1), {
      id: event2.id,
      name: event2.name,
      description: event2.description,
      status: event2.status,
      visibility: event2.visibility,
      startDateTime: toISODateWithoutMilliseconds(event2.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event2.endDateTime),
    } as EventsQuery["events"][0]);
    assert.deepEqual(response.data?.events?.at(2), {
      id: event3.id,
      name: event3.name,
      description: event3.description,
      status: event3.status,
      visibility: event3.visibility,
      startDateTime: toISODateWithoutMilliseconds(event3.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event3.endDateTime),
    } as EventsQuery["events"][0]);
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
          id: event1.id,
        },
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.events?.length, 1);
    assert.deepEqual(response.data?.events?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
    } as EventsQuery["events"][0]);
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
          visibility: EventVisibility.Private,
        },
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.events?.length, 1);
    assert.deepEqual(response.data?.events?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
    } as EventsQuery["events"][0]);
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
          status: EventStatus.Active,
        },
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.events?.length, 1);
    assert.deepEqual(response.data?.events?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
    } as EventsQuery["events"][0]);
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
          startDateTimeFrom: new Date("2021-02-02").toISOString(),
          startDateTimeTo: new Date("2021-02-03").toISOString(),
        },
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.events?.length, 1);
    assert.deepEqual(response.data?.events?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
    } as EventsQuery["events"][0]);
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
          name: "CONFERENCE",
        },
      },
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.events?.length, 1);
    assert.deepEqual(response.data?.events?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
    } as EventsQuery["events"][0]);
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
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
      community: {
        id: community1.id,
      },
      tags: [],
      users: [
        {
          id: user1.id,
        },
      ],
      usersTickets: [
        {
          id: ticket1.id,
          approvalStatus: ticket1.approvalStatus,
          paymentStatus: ticket1.paymentStatus,
          redemptionStatus: ticket1.redemptionStatus,
        },
      ],
    } as EventQuery["event"]);
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
      approvalStatus: TicketApprovalStatus.Approved,
      purchaseOrderId: purchaseOrder.id,
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      approvalStatus: TicketApprovalStatus.Pending,
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
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
      community: {
        id: community1.id,
      },
      tags: [],
      users: [
        {
          id: user1.id,
        },
      ],
      usersTickets: [
        {
          id: ticket1.id,
          approvalStatus: ticket1.approvalStatus,
          paymentStatus: ticket1.paymentStatus,
          redemptionStatus: ticket1.redemptionStatus,
        },
      ],
    } as EventQuery["event"]);
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
    const purchaseOrder = await insertPurchaseOrder();
    const ticket1 = await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      paymentStatus: TicketPaymentStatus.Paid,
      purchaseOrderId: purchaseOrder.id,
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      paymentStatus: TicketPaymentStatus.Unpaid,
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
            paymentStatus: TicketPaymentStatus.Paid,
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
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
      community: {
        id: community1.id,
      },
      tags: [],
      users: [
        {
          id: user1.id,
        },
      ],
      usersTickets: [
        {
          id: ticket1.id,
          approvalStatus: ticket1.approvalStatus,
          paymentStatus: ticket1.paymentStatus,
          redemptionStatus: ticket1.redemptionStatus,
        },
      ],
    } as EventQuery["event"]);
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
    });

    await insertTicket({
      ticketTemplateId: ticketTemplate1.id,
      userId: user1.id,
      redemptionStatus: TicketRedemptionStatus.Pending,
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
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: toISODateWithoutMilliseconds(event1.startDateTime),
      endDateTime: toISODateWithoutMilliseconds(event1.endDateTime),
      community: {
        id: community1.id,
      },
      tags: [],
      users: [
        {
          id: user1.id,
        },
      ],
      usersTickets: [
        {
          id: ticket1.id,
          approvalStatus: ticket1.approvalStatus,
          paymentStatus: ticket1.paymentStatus,
          redemptionStatus: ticket1.redemptionStatus,
        },
      ],
    } as EventQuery["event"]);
  });
});
