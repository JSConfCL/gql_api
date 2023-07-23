import { it, describe, assert, afterEach } from "vitest";
import { executeGraphqlOperation, insertEvent } from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import { Event, EventQuery, EventQueryVariables } from "./event.generated";
import {
  GetEvents,
  GetEventsQuery,
  GetEventsQueryVariables,
} from "./events.generated";
import { EventStatus, EventVisibility } from "~/generated/types";

afterEach(() => {
  clearDatabase();
});

describe("Event", () => {
  it("Should find an event by ID", async () => {
    const event1 = await insertEvent();
    const response = await executeGraphqlOperation<
      EventQuery,
      EventQueryVariables
    >({
      document: Event,
      variables: {
        eventId: event1.id,
      },
    });
    console.log(response.data);
    console.log(response.errors);

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.event, {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: event1.startDateTime.toISOString(),
      endDateTime: event1.endDateTime?.toISOString(),
    } as EventQuery["event"]);
  });

  it("return null when no event  is found", async () => {
    const response = await executeGraphqlOperation<
      EventQuery,
      EventQueryVariables
    >({
      document: Event,
      variables: {
        eventId: "FAKE_ID_NUMBER_7",
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
      GetEventsQuery,
      GetEventsQueryVariables
    >({
      document: GetEvents,
    });

    assert.equal(response.errors, undefined);
    assert.deepEqual(response.data?.events?.length, 3);
    assert.deepEqual(response.data?.events?.at(0), {
      id: event1.id,
      name: event1.name,
      description: event1.description,
      status: event1.status,
      visibility: event1.visibility,
      startDateTime: event1.startDateTime.toISOString(),
      endDateTime: event1.endDateTime?.toISOString(),
    } as GetEventsQuery["events"][0]);
    assert.deepEqual(response.data?.events?.at(1), {
      id: event2.id,
      name: event2.name,
      description: event2.description,
      status: event2.status,
      visibility: event2.visibility,
      startDateTime: event2.startDateTime.toISOString(),
      endDateTime: event2.endDateTime?.toISOString(),
    } as GetEventsQuery["events"][0]);
    assert.deepEqual(response.data?.events?.at(2), {
      id: event3.id,
      name: event3.name,
      description: event3.description,
      status: event3.status,
      visibility: event3.visibility,
      startDateTime: event3.startDateTime.toISOString(),
      endDateTime: event3.endDateTime?.toISOString(),
    } as GetEventsQuery["events"][0]);
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
    const response = await executeGraphqlOperation<
      GetEventsQuery,
      GetEventsQueryVariables
    >({
      document: GetEvents,
      variables: {
        eventId: event1.id,
        visibility: null,
        status: null,
        startDateTimeFrom: null,
        startDateTimeTo: null,
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
      startDateTime: event1.startDateTime.toISOString(),
      endDateTime: event1.endDateTime?.toISOString(),
    } as GetEventsQuery["events"][0]);
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
      GetEventsQuery,
      GetEventsQueryVariables
    >({
      document: GetEvents,
      variables: {
        eventId: null,
        visibility: EventVisibility.Private,
        status: null,
        startDateTimeFrom: null,
        startDateTimeTo: null,
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
      startDateTime: event1.startDateTime.toISOString(),
      endDateTime: event1.endDateTime?.toISOString(),
    } as GetEventsQuery["events"][0]);
  });
  it("Should Filter by Status", async () => {
    const event1 = await insertEvent({
      status: EventStatus.Active,
    });
    await insertEvent({
      status: EventStatus.Inactive,
    });
    const response = await executeGraphqlOperation<
      GetEventsQuery,
      GetEventsQueryVariables
    >({
      document: GetEvents,
      variables: {
        eventId: null,
        visibility: null,
        status: EventStatus.Active,
        startDateTimeFrom: null,
        startDateTimeTo: null,
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
      startDateTime: event1.startDateTime.toISOString(),
      endDateTime: event1.endDateTime?.toISOString(),
    } as GetEventsQuery["events"][0]);
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
      GetEventsQuery,
      GetEventsQueryVariables
    >({
      document: GetEvents,
      variables: {
        eventId: null,
        visibility: null,
        status: null,
        startDateTimeFrom: new Date("2021-02-02").toISOString(),
        startDateTimeTo: new Date("2021-02-03").toISOString(),
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
      startDateTime: event1.startDateTime.toISOString(),
      endDateTime: event1.endDateTime?.toISOString(),
    } as GetEventsQuery["events"][0]);
  });
});
