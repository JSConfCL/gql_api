import { faker } from "@faker-js/faker";
import { it, describe, assert, vi } from "vitest";

import {
  TicketTemplateStatus,
  TicketTemplateVisibility,
} from "~/generated/types";
import {
  executeGraphqlOperationAsUser,
  insertAllowedCurrency,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertUser,
  insertUserToCommunity,
  toISODateWithoutMilliseconds,
} from "~/tests/fixtures";

import {
  CreateTicket,
  CreateTicketMutation,
  CreateTicketMutationVariables,
} from "./createTicket.generated";

// We need to mock the stripe datasource to avoid making real requests
vi.mock("~/datasources/stripe");

describe("User", () => {
  it("Should create a ticket", async () => {
    const user1 = await insertUser({
      isSuperAdmin: true,
    });
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    const currency1 = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
    });
    const currency2 = await insertAllowedCurrency({
      currency: "CLP",
      validPaymentMethods: "mercado_pago",
    });
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "member",
    });

    const startDateTime = faker.date.future();
    const endDateTime = faker.date.future();

    const fakeInput: CreateTicketMutationVariables["input"] = {
      name: faker.word.words(3),
      description: faker.lorem.paragraph(3),
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      requiresApproval: false,
      unlimitedTickets: false,
      isFree: false,
      prices: [
        {
          currencyId: currency1.id,
          value: faker.number.int({
            min: 1,
            max: 100,
          }),
        },
        {
          currencyId: currency2.id,
          value: faker.number.int({
            min: 1,
            max: 100,
          }),
        },
      ],
      quantity: faker.number.int({
        min: 1,
        max: 100,
      }),
      status: TicketTemplateStatus.Active,
      visibility: TicketTemplateVisibility.Public,
      eventId: event1.id,
    };

    const response = await executeGraphqlOperationAsUser<
      CreateTicketMutation,
      CreateTicketMutationVariables
    >(
      {
        document: CreateTicket,
        variables: {
          input: {
            ...fakeInput,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors, undefined);
    assert.equal(response.data?.createTicket?.name, fakeInput.name);
    assert.equal(
      response.data?.createTicket?.startDateTime,
      toISODateWithoutMilliseconds(startDateTime),
    );
    assert.equal(
      response.data?.createTicket?.endDateTime,
      toISODateWithoutMilliseconds(endDateTime),
    );
    assert.equal(
      response.data?.createTicket?.requiresApproval,
      fakeInput.requiresApproval,
    );
    assert.equal(response.data?.createTicket?.quantity, fakeInput.quantity);
    assert.equal(response.data?.createTicket?.status, fakeInput.status);
    assert.equal(response.data?.createTicket?.visibility, fakeInput.visibility);
    assert.equal(response.data?.createTicket?.eventId, fakeInput.eventId);
  });
  it("It should throw an error, if don't have permission", async () => {
    const user1 = await insertUser();
    const community1 = await insertCommunity();
    const event1 = await insertEvent();
    await insertEventToCommunity({
      eventId: event1.id,
      communityId: community1.id,
    });
    await insertUserToCommunity({
      communityId: community1.id,
      userId: user1.id,
      role: "member",
    });

    const response = await executeGraphqlOperationAsUser<
      CreateTicketMutation,
      CreateTicketMutationVariables
    >(
      {
        document: CreateTicket,
        variables: {
          input: {
            name: faker.word.words(3),
            isFree: false,
            eventId: event1.id,
            startDateTime: faker.date.future().toISOString(),
            unlimitedTickets: true,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors?.[0].message, "Not authorized");
  });
});
