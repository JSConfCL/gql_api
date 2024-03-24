import { assert, describe, it } from "vitest";

import {
  executeGraphqlOperationAsUser,
  insertAllowedCurrency,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertPrice,
  insertTicketPrice,
  insertTicketTemplate,
  insertUser,
} from "~/tests/fixtures";

import {
  SingleEventWithPricing,
  SingleEventWithPricingQuery,
  SingleEventWithPricingQueryVariables,
} from "./eventsTicketsWithPricing.generated";

const createAllTickets = async (eventId: string) => {
  const ticket = await insertTicketTemplate({
    eventId: eventId,
    status: "active",
    visibility: "public",
  });
  const ticket2 = await insertTicketTemplate({
    eventId: eventId,
    status: "active",
    visibility: "private",
  });
  const ticket3 = await insertTicketTemplate({
    eventId: eventId,
    status: "active",
    visibility: "unlisted",
  });
  const ticket4 = await insertTicketTemplate({
    eventId: eventId,
    status: "inactive",
    visibility: "public",
  });
  const ticket5 = await insertTicketTemplate({
    eventId: eventId,
    status: "inactive",
    visibility: "private",
  });
  const ticket6 = await insertTicketTemplate({
    eventId: eventId,
    status: "inactive",
    visibility: "unlisted",
  });

  return [ticket, ticket2, ticket3, ticket4, ticket5, ticket6] as const;
};

describe("Should get an event and its tickets", () => {
  it("as a User", async () => {
    const user1 = await insertUser({
      isSuperAdmin: false,
    });
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    const [ticket] = await createAllTickets(event1.id);
    const insertedCurrency = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });
    const insertedPrice = await insertPrice({
      price: 100,
      currencyId: insertedCurrency.id,
    });
    await insertTicketPrice({
      ticketId: ticket.id,
      priceId: insertedPrice.id,
    });
    const response = await executeGraphqlOperationAsUser<
      SingleEventWithPricingQuery,
      SingleEventWithPricingQueryVariables
    >(
      {
        document: SingleEventWithPricing,
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.events?.length, 1);
    assert.equal(response.data?.events[0]?.tickets.length, 1);
    assert.equal(response.data?.events[0]?.tickets[0]?.prices?.length, 1);
    assert.equal(
      response.data?.events[0]?.tickets[0]?.prices?.[0].amount,
      insertedPrice.price,
    );
    assert.equal(
      response.data?.events[0]?.tickets[0]?.prices?.[0].id,
      insertedPrice.id,
    );
    assert.equal(
      response.data?.events[0]?.tickets[0]?.prices?.[0].currency.id,
      insertedCurrency.id,
    );
    assert.equal(
      response.data?.events[0]?.tickets[0]?.prices?.[0].currency.currency,
      insertedCurrency.currency,
    );
    assert.equal(
      response.data?.events[0]?.tickets[0]?.prices?.[0].currency
        .validPaymentMethods,
      insertedCurrency.validPaymentMethods,
    );
  });
});
