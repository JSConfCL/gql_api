import { assert, describe, it } from "vitest";

import { AddonConstraintType } from "~/datasources/db/ticketAddons";
import { AddonConstraintType as GraphQLAddonConstraintType } from "~/generated/types";
import {
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  insertEvent,
  insertUser,
  insertUserToCommunity,
  insertCommunity,
  insertEventToCommunity,
  insertTicketTemplate,
  SAMPLE_TEST_UUID,
  insertAllowedCurrency,
} from "~/tests/fixtures";
import { getTestDB } from "~/tests/fixtures/databaseHelper";

import {
  CreateAddon,
  CreateAddonMutation,
  CreateAddonMutationVariables,
} from "./createAddon.generated";

describe("Create Addon", () => {
  describe("Authorization", () => {
    it("Should allow creating addon as super admin", async () => {
      const event = await insertEvent();

      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >({
        document: CreateAddon,
        variables: {
          input: {
            name: "Test Addon",
            description: "Test Addon Description",
            totalStock: 100,
            maxPerTicket: 2,
            isUnlimited: false,
            eventId: event.id,
            isFree: true,
          },
        },
      });

      assert.equal(response.errors, undefined);

      assert.exists(response.data?.createAddon?.id);

      // Verify in DB
      const data = response.data;

      if (data) {
        const DB = await getTestDB();
        const addon = await DB.query.addonsSchema.findFirst({
          where: (addon, { eq }) => eq(addon.id, data.createAddon.id),
        });

        assert.exists(addon);

        assert.equal(addon?.name, "Test Addon");

        assert.equal(addon?.description, "Test Addon Description");

        assert.equal(addon?.totalStock, 100);

        assert.equal(addon?.maxPerTicket, 2);

        assert.equal(addon?.isUnlimited, false);

        assert.equal(addon?.eventId, event.id);
      }
    });

    it("Should not allow creating addon as regular user", async () => {
      const community = await insertCommunity();
      const event = await insertEvent();
      const user = await insertUser();

      await insertEventToCommunity({
        eventId: event.id,
        communityId: community.id,
      });

      await insertUserToCommunity({
        userId: user.id,
        communityId: community.id,
        role: "member",
      });

      const response = await executeGraphqlOperationAsUser<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >(
        {
          document: CreateAddon,
          variables: {
            input: {
              name: "Test Addon",
              description: "Test Addon Description",
              totalStock: 100,
              maxPerTicket: 2,
              isUnlimited: false,
              eventId: event.id,
              isFree: true,
            },
          },
        },
        user,
      );

      assert.exists(response.errors);

      assert.include(
        response.errors?.[0].message.toLowerCase(),
        "unauthorized",
      );
    });
  });

  describe("Validation", () => {
    it("Should not allow creating addon with negative stock", async () => {
      const event = await insertEvent();

      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >({
        document: CreateAddon,
        variables: {
          input: {
            name: "Test Addon",
            description: "Test Addon Description",
            totalStock: -1,
            maxPerTicket: 2,
            isUnlimited: false,
            eventId: event.id,
            isFree: true,
          },
        },
      });

      assert.exists(response.errors);
    });

    it("Should not allow creating addon with negative maxPerTicket", async () => {
      const event = await insertEvent();

      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >({
        document: CreateAddon,
        variables: {
          input: {
            name: "Test Addon",
            description: "Test Addon Description",
            totalStock: 100,
            maxPerTicket: -1,
            isUnlimited: false,
            eventId: event.id,
            isFree: true,
          },
        },
      });

      assert.exists(response.errors);
    });

    it("Should allow creating unlimited addon without stock limits", async () => {
      const event = await insertEvent();

      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >({
        document: CreateAddon,
        variables: {
          input: {
            name: "Unlimited Addon",
            description: "Unlimited Addon Description",
            isUnlimited: true,
            eventId: event.id,
            isFree: true,
          },
        },
      });

      assert.equal(response.errors, undefined);

      assert.exists(response.data?.createAddon?.id);

      // Verify in DB
      const data = response.data;

      if (data) {
        const DB = await getTestDB();
        const addon = await DB.query.addonsSchema.findFirst({
          where: (addon, { eq }) => eq(addon.id, data.createAddon.id),
        });

        assert.exists(addon);

        assert.equal(addon?.isUnlimited, true);

        assert.isNull(addon?.totalStock);

        assert.isNull(addon?.maxPerTicket);
      }
    });

    it("Should not allow creating addon for non-existent event", async () => {
      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >({
        document: CreateAddon,
        variables: {
          input: {
            name: "Test Addon",
            description: "Test Addon Description",
            totalStock: 100,
            maxPerTicket: 2,
            isUnlimited: false,
            eventId: SAMPLE_TEST_UUID,
            isFree: true,
          },
        },
      });

      assert.exists(response.errors);
    });

    it("Should allow creating addon with prices when not free", async () => {
      const event = await insertEvent();

      const usdCurrency = await insertAllowedCurrency({
        currency: "USD",
      });

      const eurCurrency = await insertAllowedCurrency({
        currency: "EUR",
      });

      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >({
        document: CreateAddon,
        variables: {
          input: {
            name: "Paid Addon",
            description: "Paid Addon Description",
            totalStock: 100,
            maxPerTicket: 2,
            isUnlimited: false,
            eventId: event.id,
            isFree: false,
            prices: [
              { value_in_cents: 1000, currencyId: usdCurrency.id },
              { value_in_cents: 900, currencyId: eurCurrency.id },
            ],
          },
        },
      });

      assert.equal(response.errors, undefined);

      assert.exists(response.data?.createAddon?.id);

      // Verify prices in DB
      const data = response.data;

      if (data) {
        const DB = await getTestDB();
        const addonPrices = await DB.query.addonsPricesSchema.findMany({
          where: (ap, { eq }) => eq(ap.addonId, data.createAddon.id),
          with: {
            price: true,
          },
        });

        assert.equal(addonPrices.length, 2);

        assert.includeDeepMembers(
          addonPrices.map((ap) => ({
            price_in_cents: ap.price.price_in_cents,
            currencyId: ap.price.currencyId,
          })),
          [
            { price_in_cents: 1000, currencyId: usdCurrency.id },
            { price_in_cents: 900, currencyId: eurCurrency.id },
          ],
        );
      }
    });

    it("Should not allow prices when addon is free", async () => {
      const event = await insertEvent();

      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >({
        document: CreateAddon,
        variables: {
          input: {
            name: "Free Addon",
            description: "Free Addon Description",
            totalStock: 100,
            maxPerTicket: 2,
            isUnlimited: false,
            eventId: event.id,
            isFree: true,
            prices: [{ value_in_cents: 1000, currencyId: "USD" }],
          },
        },
      });

      assert.exists(response.errors);

      assert.include(
        response.errors?.[0].message.toLowerCase(),
        "addon cannot be free and have prices",
      );
    });

    it("Should allow creating addon with constraints", async () => {
      const event = await insertEvent();
      const ticket = await insertTicketTemplate({ eventId: event.id });

      // Create first addon
      const addon1Response = await executeGraphqlOperationAsSuperAdmin<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >({
        document: CreateAddon,
        variables: {
          input: {
            name: "First Addon",
            eventId: event.id,
            isFree: true,
            isUnlimited: true,
            tickets: [{ ticketId: ticket.id, orderDisplay: 1 }],
          },
        },
      });

      assert.equal(addon1Response.errors, undefined);

      assert.exists(addon1Response.data?.createAddon?.id);

      const addon1 = addon1Response.data?.createAddon;

      if (!addon1) {
        throw new Error("Addon 1 not created");
      }

      // Create second addon with constraint
      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >({
        document: CreateAddon,
        variables: {
          input: {
            name: "Second Addon",
            eventId: event.id,
            isFree: true,
            isUnlimited: true,
            tickets: [{ ticketId: ticket.id, orderDisplay: 2 }],
            constraints: [
              {
                relatedAddonId: addon1Response.data.createAddon.id,
                constraintType: GraphQLAddonConstraintType.Dependency,
              },
            ],
          },
        },
      });

      assert.equal(response.errors, undefined);

      assert.exists(response.data?.createAddon?.id);

      // Verify constraint in DB
      const data = response.data;

      if (data) {
        const DB = await getTestDB();
        const constraints = await DB.query.addonConstraintsSchema.findMany({
          where: (ac, { eq }) => eq(ac.addonId, data.createAddon.id),
        });

        assert.equal(constraints.length, 1);

        assert.equal(
          constraints[0].relatedAddonId,
          addon1Response.data.createAddon.id,
        );

        assert.equal(
          constraints[0].constraintType,
          AddonConstraintType.DEPENDENCY,
        );
      }
    });

    it("Should not allow constraints with non-existent addon", async () => {
      const event = await insertEvent();
      const ticket = await insertTicketTemplate({ eventId: event.id });

      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >({
        document: CreateAddon,
        variables: {
          input: {
            name: "Test Addon",
            eventId: event.id,
            isFree: true,
            isUnlimited: true,
            tickets: [{ ticketId: ticket.id, orderDisplay: 1 }],
            constraints: [
              {
                relatedAddonId: SAMPLE_TEST_UUID,
                constraintType: GraphQLAddonConstraintType.Dependency,
              },
            ],
          },
        },
      });

      assert.exists(response.errors);

      assert.include(
        response.errors?.[0].message.toLowerCase(),
        `addons with ids ${SAMPLE_TEST_UUID} are not available in the same tickets`,
      );
    });

    it("Should not allow creating addon with non-existent ticket", async () => {
      const event = await insertEvent();

      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateAddonMutation,
        CreateAddonMutationVariables
      >({
        document: CreateAddon,
        variables: {
          input: {
            name: "Test Addon",
            eventId: event.id,
            isFree: true,
            isUnlimited: true,
            tickets: [{ ticketId: SAMPLE_TEST_UUID, orderDisplay: 1 }],
          },
        },
      });

      assert.exists(response.errors);

      assert.include(
        response.errors?.[0].message.toLowerCase(),
        `tickets ${SAMPLE_TEST_UUID} do not belong to the specified event`,
      );
    });
  });
});
