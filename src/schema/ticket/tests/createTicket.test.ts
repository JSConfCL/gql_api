import { faker } from "@faker-js/faker";
import { AsyncReturnType } from "type-fest";
import { it, describe, assert, vi } from "vitest";

import {
  TicketTemplateStatus,
  TicketTemplateVisibility,
  ValidPaymentMethods,
} from "~/generated/types";
import {
  executeGraphqlOperation,
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

const userSetup = async ({
  user,
  event,
  community,
}: {
  user?: AsyncReturnType<typeof insertUser>;
  event?: AsyncReturnType<typeof insertEvent>;
  community?: AsyncReturnType<typeof insertCommunity>;
} = {}) => {
  const user1 =
    user ??
    (await insertUser({
      isSuperAdmin: false,
    }));
  const community1 = community ?? (await insertCommunity());
  const event1 = event ?? (await insertEvent());

  await insertEventToCommunity({
    eventId: event1.id,
    communityId: community1.id,
  });

  return { user1, community1, event1 };
};

const superAdminSetup = async () => {
  const user1 = await insertUser({
    isSuperAdmin: true,
  });

  return userSetup({ user: user1 });
};

const correctStartAndEndDateTime = () => {
  const startDateTime = faker.date.future({
    years: 1,
  });
  const endDateTime = faker.date.future({
    refDate: startDateTime,
    years: 1,
  });

  return {
    startDateTime,
    endDateTime,
  };
};

const communityAdminSetup = async () => {
  const setup = await userSetup();
  const userToCommunity = await insertUserToCommunity({
    communityId: setup.community1.id,
    userId: setup.user1.id,
    role: "admin",
  });

  return { ...setup, userToCommunity };
};

describe("As a SUPER_ADMIN", () => {
  describe("Should create a ticket", () => {
    it("With USD pricing and CLP pricing", async () => {
      const { user1, event1 } = await superAdminSetup();
      const currency1 = await insertAllowedCurrency({
        currency: "USD",
        validPaymentMethods: "stripe",
      });
      const currency2 = await insertAllowedCurrency({
        currency: "CLP",
        validPaymentMethods: "mercado_pago",
      });

      const { startDateTime, endDateTime } = correctStartAndEndDateTime();
      const value1 = faker.number.int({
        min: 1,
        max: 100,
      });
      const value2 = faker.number.int({
        min: 1,
        max: 100,
      });
      const input: CreateTicketMutationVariables["input"] = {
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
            value_in_cents: value1,
          },
          {
            currencyId: currency2.id,
            value_in_cents: value2,
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
            input,
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(response.data?.createTicket?.name, input.name);
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
        input.requiresApproval,
      );
      assert.equal(response.data?.createTicket?.quantity, input.quantity);
      assert.equal(response.data?.createTicket?.status, input.status);
      assert.equal(response.data?.createTicket?.visibility, input.visibility);
      assert.equal(response.data?.createTicket.eventId, input.eventId);
      assert.equal(response.data?.createTicket.prices?.[0].amount, value1);
      assert.deepEqual(response.data?.createTicket.prices?.[0].currency, {
        currency: currency1.currency,
        id: currency1.id,
        validPaymentMethods: ValidPaymentMethods.Stripe,
      });
      assert.equal(response.data?.createTicket.prices?.[1].amount, value2);
      assert.deepEqual(response.data?.createTicket.prices?.[1].currency, {
        currency: currency2.currency,
        id: currency2.id,
        validPaymentMethods: ValidPaymentMethods.MercadoPago,
      });
    });
  });
  describe("Should create a free ticket", () => {
    it("Without pricing", async () => {
      const { user1, event1 } = await superAdminSetup();
      const { startDateTime, endDateTime } = correctStartAndEndDateTime();

      const input: CreateTicketMutationVariables["input"] = {
        name: faker.word.words(3),
        description: faker.lorem.paragraph(3),
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        requiresApproval: false,
        unlimitedTickets: false,
        isFree: true,
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
            input,
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(response.data?.createTicket?.name, input.name);
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
        input.requiresApproval,
      );
      assert.equal(response.data?.createTicket?.isFree, true);
      assert.equal(response.data?.createTicket?.quantity, input.quantity);
      assert.equal(response.data?.createTicket?.status, input.status);
      assert.equal(response.data?.createTicket?.visibility, input.visibility);
      assert.equal(response.data?.createTicket.eventId, input.eventId);
      assert.equal(response.data?.createTicket.prices, null);
    });
  });
  describe("Should create an unlimited ticket", () => {
    it("With pricing", async () => {
      const { user1, event1 } = await superAdminSetup();
      const currency1 = await insertAllowedCurrency({
        currency: "USD",
        validPaymentMethods: "stripe",
      });

      const { startDateTime, endDateTime } = correctStartAndEndDateTime();

      const value1 = faker.number.int({
        min: 1,
        max: 100,
      });
      const input: CreateTicketMutationVariables["input"] = {
        name: faker.word.words(3),
        description: faker.lorem.paragraph(3),
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        requiresApproval: false,
        unlimitedTickets: true,
        isFree: false,
        prices: [
          {
            currencyId: currency1.id,
            value_in_cents: value1,
          },
        ],
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
            input,
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(response.data?.createTicket?.name, input.name);
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
        input.requiresApproval,
      );
      assert.equal(response.data?.createTicket?.quantity, null);
      assert.equal(response.data?.createTicket?.isUnlimited, true);
      assert.equal(response.data?.createTicket?.isFree, false);
      assert.equal(response.data?.createTicket?.status, input.status);
      assert.equal(response.data?.createTicket?.visibility, input.visibility);
      assert.equal(response.data?.createTicket.eventId, input.eventId);
      assert.equal(response.data?.createTicket.prices?.[0].amount, value1);
      assert.deepEqual(response.data?.createTicket.prices?.[0].currency, {
        currency: currency1.currency,
        id: currency1.id,
        validPaymentMethods: ValidPaymentMethods.Stripe,
      });
    });
    it("without pricing", async () => {
      const { user1, event1 } = await superAdminSetup();
      const { startDateTime, endDateTime } = correctStartAndEndDateTime();

      const input: CreateTicketMutationVariables["input"] = {
        name: faker.word.words(3),
        description: faker.lorem.paragraph(3),
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        requiresApproval: false,
        unlimitedTickets: true,
        isFree: true,
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
            input,
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(response.data?.createTicket?.name, input.name);
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
        input.requiresApproval,
      );
      assert.equal(response.data?.createTicket?.quantity, null);
      assert.equal(response.data?.createTicket?.isUnlimited, true);
      assert.equal(response.data?.createTicket?.isFree, true);
      assert.equal(response.data?.createTicket?.status, input.status);
      assert.equal(response.data?.createTicket?.visibility, input.visibility);
      assert.equal(response.data?.createTicket.eventId, input.eventId);
      assert.equal(response.data?.createTicket.prices, null);
    });
  });
});

describe("Should throw an error", () => {
  it("If user don't have permission", async () => {
    const user1 = await insertUser({
      isSuperAdmin: false,
    });
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
  it("If event does not exist", async () => {
    const { user1 } = await superAdminSetup();
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
            eventId: faker.string.uuid(),
            startDateTime: faker.date.future().toISOString(),
            unlimitedTickets: true,
          },
        },
      },
      user1,
    );

    assert.equal(response.errors?.[0].message, "Event not found");
  });
  it("If currency does not exist", async () => {
    const { user1, event1 } = await superAdminSetup();
    const price = faker.number.int({
      min: 10,
      max: 10000,
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
            prices: [
              {
                currencyId: faker.string.uuid(),
                value_in_cents: price,
              },
            ],
          },
        },
      },
      user1,
    );

    assert.equal(response.errors?.[0].message, "Error creating price");
  });
  it("If price is 0 (or less than 0) and isFree is false", async () => {
    const { user1, event1 } = await superAdminSetup();
    const currency1 = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
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
            prices: [
              {
                currencyId: currency1.id,
                value_in_cents: -1,
              },
            ],
          },
        },
      },
      user1,
    );

    assert.equal(
      response.errors?.[0].message,
      "Price must be greater than 0. If this is a free ticket, set isFree to true.",
    );
  });
  it("If price is set and isFree is true", async () => {
    const { user1, event1 } = await superAdminSetup();
    const currency1 = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
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
            isFree: true,
            eventId: event1.id,
            startDateTime: faker.date.future().toISOString(),
            unlimitedTickets: true,
            prices: [
              {
                currencyId: currency1.id,
                value_in_cents: 10,
              },
            ],
          },
        },
      },
      user1,
    );

    assert.equal(
      response.errors?.[0].message,
      "Prices array must not be provided if ticket is free",
    );
  });
  it("If startDateTime is in the past", async () => {
    const { user1, event1 } = await superAdminSetup();
    const currency1 = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
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
            startDateTime: faker.date.past().toISOString(),
            unlimitedTickets: true,
            prices: [
              {
                currencyId: currency1.id,
                value_in_cents: 10,
              },
            ],
          },
        },
      },
      user1,
    );

    assert.equal(
      response.errors?.[0].message,
      "Start date must be in the future",
    );
  });
  it("If endDateTime is before startDateTime", async () => {
    const { user1, event1 } = await superAdminSetup();
    const currency1 = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
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
            endDateTime: faker.date.past().toISOString(),
            unlimitedTickets: true,
            prices: [
              {
                currencyId: currency1.id,
                value_in_cents: 10,
              },
            ],
          },
        },
      },
      user1,
    );

    assert.equal(
      response.errors?.[0].message,
      "End date must be after start date",
    );
  });
  it("If tickets are unlimited and quantity is provided", async () => {
    const { user1, event1 } = await superAdminSetup();
    const currency1 = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
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
            quantity: 10,
            prices: [
              {
                currencyId: currency1.id,
                value_in_cents: 10,
              },
            ],
          },
        },
      },
      user1,
    );

    assert.equal(
      response.errors?.[0].message,
      "Quantity must not be provided if tickets are unlimited",
    );
  });
  it("If quantity is 0 (or less than 0) and tickets are not unlimited", async () => {
    const { user1, event1 } = await superAdminSetup();
    const currency1 = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
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
            unlimitedTickets: false,
            quantity: 0,
            prices: [
              {
                currencyId: currency1.id,
                value_in_cents: 10,
              },
            ],
          },
        },
      },
      user1,
    );

    assert.equal(
      response.errors?.[0].message,
      "Quantity must be provided if tickets are not unlimited",
    );
  });
  it("If amount of tickets is negative", async () => {
    const { user1, event1 } = await superAdminSetup();
    const currency1 = await insertAllowedCurrency({
      currency: "USD",
      validPaymentMethods: "stripe",
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
            unlimitedTickets: false,
            quantity: -1,
            prices: [
              {
                currencyId: currency1.id,
                value_in_cents: 10,
              },
            ],
          },
        },
      },
      user1,
    );

    assert.equal(
      response.errors?.[0].message,
      "Cannot have negative quantity of tickets",
    );
  });
  it("If we sent an empty prices array", async () => {
    const { user1, event1 } = await superAdminSetup();
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
            unlimitedTickets: false,
            quantity: 10,
            prices: [],
          },
        },
      },
      user1,
    );

    assert.equal(
      response.errors?.[0].message,
      "Prices array must not be empty",
    );
  });
  it("CurrencyId is required if prices are provided", async () => {
    const { user1, event1 } = await superAdminSetup();
    const value_in_cents = 10;
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
            unlimitedTickets: false,
            quantity: 10,
            prices: [
              // @ts-expect-error we are testing the error case
              {
                value_in_cents,
              },
            ],
          },
        },
      },
      user1,
    );

    assert.equal(
      response.errors?.[0].message,
      `Variable "$input" got invalid value { value_in_cents: ${value_in_cents} } at "input.prices[0]"; Field "currencyId" of required type "String!" was not provided.`,
    );
  });
  it("If user is not authenticated", async () => {
    const { event1 } = await superAdminSetup();
    const response = await executeGraphqlOperation<
      CreateTicketMutation,
      CreateTicketMutationVariables
    >({
      document: CreateTicket,
      variables: {
        input: {
          name: faker.word.words(3),
          isFree: false,
          eventId: event1.id,
          startDateTime: faker.date.future().toISOString(),
          unlimitedTickets: false,
          quantity: 10,
          prices: [
            {
              currencyId: faker.string.uuid(),
              value_in_cents: 10,
            },
          ],
        },
      },
    });

    assert.equal(response.errors?.[0].message, "User is not authenticated");
  });
});

// THESE ARE COPY-PASTED FROM THE ABOVE TESTS BUT USING A DIFFERENT USER ASSOCIATION
describe("As an ADMIN-USER", () => {
  describe("Should create a ticket", () => {
    it("With USD pricing and CLP pricing", async () => {
      const { user1, event1 } = await communityAdminSetup();
      const currency1 = await insertAllowedCurrency({
        currency: "USD",
        validPaymentMethods: "stripe",
      });
      const currency2 = await insertAllowedCurrency({
        currency: "CLP",
        validPaymentMethods: "mercado_pago",
      });

      const { startDateTime, endDateTime } = correctStartAndEndDateTime();

      const value1 = faker.number.int({
        min: 1,
        max: 100,
      });
      const value2 = faker.number.int({
        min: 1,
        max: 100,
      });
      const input: CreateTicketMutationVariables["input"] = {
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
            value_in_cents: value1,
          },
          {
            currencyId: currency2.id,
            value_in_cents: value2,
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
            input,
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(response.data?.createTicket?.name, input.name);
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
        input.requiresApproval,
      );
      assert.equal(response.data?.createTicket?.quantity, input.quantity);
      assert.equal(response.data?.createTicket?.status, input.status);
      assert.equal(response.data?.createTicket?.visibility, input.visibility);
      assert.equal(response.data?.createTicket.eventId, input.eventId);
      assert.equal(response.data?.createTicket.prices?.[0].amount, value1);
      assert.deepEqual(response.data?.createTicket.prices?.[0].currency, {
        currency: currency1.currency,
        id: currency1.id,
        validPaymentMethods: ValidPaymentMethods.Stripe,
      });
      assert.equal(response.data?.createTicket.prices?.[1].amount, value2);
      assert.deepEqual(response.data?.createTicket.prices?.[1].currency, {
        currency: currency2.currency,
        id: currency2.id,
        validPaymentMethods: ValidPaymentMethods.MercadoPago,
      });
    });
  });
  describe("Should create a free ticket", () => {
    it("Without pricing", async () => {
      const { user1, event1 } = await communityAdminSetup();
      const { startDateTime, endDateTime } = correctStartAndEndDateTime();

      const input: CreateTicketMutationVariables["input"] = {
        name: faker.word.words(3),
        description: faker.lorem.paragraph(3),
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        requiresApproval: false,
        unlimitedTickets: false,
        isFree: true,
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
            input,
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(response.data?.createTicket?.name, input.name);
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
        input.requiresApproval,
      );
      assert.equal(response.data?.createTicket?.isFree, true);
      assert.equal(response.data?.createTicket?.quantity, input.quantity);
      assert.equal(response.data?.createTicket?.status, input.status);
      assert.equal(response.data?.createTicket?.visibility, input.visibility);
      assert.equal(response.data?.createTicket.eventId, input.eventId);
      assert.equal(response.data?.createTicket.prices, null);
    });
  });
  describe("Should create an unlimited ticket", () => {
    it("With pricing", async () => {
      const { user1, event1 } = await communityAdminSetup();
      const currency1 = await insertAllowedCurrency({
        currency: "USD",
        validPaymentMethods: "stripe",
      });

      const { startDateTime, endDateTime } = correctStartAndEndDateTime();

      const value1 = faker.number.int({
        min: 1,
        max: 100,
      });
      const input: CreateTicketMutationVariables["input"] = {
        name: faker.word.words(3),
        description: faker.lorem.paragraph(3),
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        requiresApproval: false,
        unlimitedTickets: true,
        isFree: false,
        prices: [
          {
            currencyId: currency1.id,
            value_in_cents: value1,
          },
        ],
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
            input,
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(response.data?.createTicket?.name, input.name);
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
        input.requiresApproval,
      );
      assert.equal(response.data?.createTicket?.quantity, null);
      assert.equal(response.data?.createTicket?.isUnlimited, true);
      assert.equal(response.data?.createTicket?.isFree, false);
      assert.equal(response.data?.createTicket?.status, input.status);
      assert.equal(response.data?.createTicket?.visibility, input.visibility);
      assert.equal(response.data?.createTicket.eventId, input.eventId);
      assert.equal(response.data?.createTicket.prices?.[0].amount, value1);
      assert.deepEqual(response.data?.createTicket.prices?.[0].currency, {
        currency: currency1.currency,
        id: currency1.id,
        validPaymentMethods: ValidPaymentMethods.Stripe,
      });
    });
    it("without pricing", async () => {
      const { user1, event1 } = await communityAdminSetup();
      const { startDateTime, endDateTime } = correctStartAndEndDateTime();

      const input: CreateTicketMutationVariables["input"] = {
        name: faker.word.words(3),
        description: faker.lorem.paragraph(3),
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        requiresApproval: false,
        unlimitedTickets: true,
        isFree: true,
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
            input,
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(response.data?.createTicket?.name, input.name);
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
        input.requiresApproval,
      );
      assert.equal(response.data?.createTicket?.quantity, null);
      assert.equal(response.data?.createTicket?.isUnlimited, true);
      assert.equal(response.data?.createTicket?.isFree, true);
      assert.equal(response.data?.createTicket?.status, input.status);
      assert.equal(response.data?.createTicket?.visibility, input.visibility);
      assert.equal(response.data?.createTicket.eventId, input.eventId);
      assert.equal(response.data?.createTicket.prices, null);
    });
  });
});
