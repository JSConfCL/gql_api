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
  insertAddon,
  insertAllowedCurrency,
  insertTicketAddon,
  insertAddonConstraint,
  insertAddonPrice,
  insertPrice,
} from "~/tests/fixtures";
import { getTestDB } from "~/tests/fixtures/databaseHelper";

import {
  UpdateAddon,
  UpdateAddonMutation,
  UpdateAddonMutationVariables,
} from "./updateAddon.generated";

describe("Update Addon", () => {
  describe("Authorization", () => {
    it("Should allow updating addon as super admin", async () => {
      const event = await insertEvent();
      const addon = await insertAddon({
        name: "Addon",
        eventId: event.id,
      });

      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateAddonMutation,
        UpdateAddonMutationVariables
      >({
        document: UpdateAddon,
        variables: {
          input: {
            id: addon.id,
            name: "Updated Addon",
            description: "Updated Description",
          },
        },
      });

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.updateAddon?.name, "Updated Addon");
    });

    it("Should not allow updating addon as regular user", async () => {
      const community = await insertCommunity();
      const event = await insertEvent();
      const user = await insertUser();
      const addon = await insertAddon({
        name: "Addon",
        eventId: event.id,
      });

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
        UpdateAddonMutation,
        UpdateAddonMutationVariables
      >(
        {
          document: UpdateAddon,
          variables: {
            input: {
              id: addon.id,
              name: "Updated Addon",
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

  describe("Constraint Validation", () => {
    it("Should detect direct cyclic dependencies", async () => {
      const event = await insertEvent();
      const ticket = await insertTicketTemplate({ eventId: event.id });

      const addon1 = await insertAddon({
        eventId: event.id,
        name: "Addon 1",
      });

      await insertTicketAddon({
        addonId: addon1.id,
        ticketId: ticket.id,
        orderDisplay: 1,
      });

      const addon2 = await insertAddon({
        eventId: event.id,
        name: "Addon 2",
      });

      await insertTicketAddon({
        addonId: addon2.id,
        ticketId: ticket.id,
        orderDisplay: 2,
      });

      await insertAddonConstraint({
        addonId: addon2.id,
        relatedAddonId: addon1.id,
        constraintType: AddonConstraintType.DEPENDENCY,
      });

      // Try to update addon1 to depend on addon2, creating a cycle
      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateAddonMutation,
        UpdateAddonMutationVariables
      >({
        document: UpdateAddon,
        variables: {
          input: {
            id: addon1.id,
            newConstraints: [
              {
                relatedAddonId: addon2.id,
                constraintType: GraphQLAddonConstraintType.Dependency,
              },
            ],
          },
        },
      });

      assert.exists(response.errors);

      assert.include(
        response.errors?.[0].message.toLowerCase(),
        "cyclic dependency detected",
      );
    });

    it("Should detect indirect cyclic dependencies", async () => {
      const event = await insertEvent();
      const ticket = await insertTicketTemplate({ eventId: event.id });

      const addon1 = await insertAddon({
        name: "Addon 1",
        eventId: event.id,
      });

      await insertTicketAddon({
        addonId: addon1.id,
        ticketId: ticket.id,
        orderDisplay: 1,
      });

      const addon2 = await insertAddon({
        name: "Addon 2",
        eventId: event.id,
      });

      await insertTicketAddon({
        addonId: addon2.id,
        ticketId: ticket.id,
        orderDisplay: 2,
      });

      await insertAddonConstraint({
        addonId: addon2.id,
        relatedAddonId: addon1.id,
        constraintType: AddonConstraintType.DEPENDENCY,
      });

      const addon3 = await insertAddon({
        name: "Addon 3",
        eventId: event.id,
      });

      await insertTicketAddon({
        addonId: addon3.id,
        ticketId: ticket.id,
        orderDisplay: 3,
      });

      await insertAddonConstraint({
        addonId: addon3.id,
        relatedAddonId: addon2.id,
        constraintType: AddonConstraintType.DEPENDENCY,
      });

      // Try to update addon1 to depend on addon3, creating an indirect cycle
      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateAddonMutation,
        UpdateAddonMutationVariables
      >({
        document: UpdateAddon,
        variables: {
          input: {
            id: addon1.id,
            newConstraints: [
              {
                relatedAddonId: addon3.id,
                constraintType: GraphQLAddonConstraintType.Dependency,
              },
            ],
          },
        },
      });

      assert.exists(response.errors);

      assert.include(
        response.errors?.[0].message.toLowerCase(),
        "cyclic dependency detected",
      );
    });

    it("Should allow valid constraint updates", async () => {
      const event = await insertEvent();
      const ticket = await insertTicketTemplate({ eventId: event.id });

      const addon1 = await insertAddon({
        name: "Addon 1",
        eventId: event.id,
      });

      await insertTicketAddon({
        addonId: addon1.id,
        ticketId: ticket.id,
        orderDisplay: 1,
      });

      const addon2 = await insertAddon({
        name: "Addon 2",
        eventId: event.id,
      });

      await insertTicketAddon({
        addonId: addon2.id,
        ticketId: ticket.id,
        orderDisplay: 2,
      });

      // Update addon2 to depend on addon1 (valid case)
      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateAddonMutation,
        UpdateAddonMutationVariables
      >({
        document: UpdateAddon,
        variables: {
          input: {
            id: addon2.id,
            newConstraints: [
              {
                relatedAddonId: addon1.id,
                constraintType: GraphQLAddonConstraintType.Dependency,
              },
            ],
          },
        },
      });

      assert.equal(response.errors, undefined);

      // Verify constraint in DB
      const DB = await getTestDB();
      const constraints = await DB.query.addonConstraintsSchema.findMany({
        where: (ac, { eq }) => eq(ac.addonId, addon2.id),
      });

      assert.equal(constraints.length, 1);

      assert.equal(constraints[0].relatedAddonId, addon1.id);

      assert.equal(
        constraints[0].constraintType,
        AddonConstraintType.DEPENDENCY,
      );
    });

    it("Should handle constraint updates and deletions", async () => {
      const event = await insertEvent();
      const ticket = await insertTicketTemplate({ eventId: event.id });

      const addon1 = await insertAddon({ name: "Addon 1", eventId: event.id });

      await insertTicketAddon({
        addonId: addon1.id,
        ticketId: ticket.id,
        orderDisplay: 1,
      });

      const addon2 = await insertAddon({ name: "Addon 2", eventId: event.id });

      await insertTicketAddon({
        addonId: addon2.id,
        ticketId: ticket.id,
        orderDisplay: 2,
      });

      const constraint = await insertAddonConstraint({
        addonId: addon1.id,
        relatedAddonId: addon2.id,
        constraintType: AddonConstraintType.DEPENDENCY,
      });

      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateAddonMutation,
        UpdateAddonMutationVariables
      >({
        document: UpdateAddon,
        variables: {
          input: {
            id: addon1.id,
            updateConstraints: [
              {
                id: constraint.id,
                relatedAddonId: addon2.id,
                constraintType: GraphQLAddonConstraintType.MutualExclusion,
              },
            ],
            deleteConstraintIds: [constraint.id],
          },
        },
      });

      assert.equal(response.errors, undefined);

      // Verify DB state
      const DB = await getTestDB();
      const constraints = await DB.query.addonConstraintsSchema.findMany({
        where: (ac, { eq }) => eq(ac.addonId, addon1.id),
      });

      assert.equal(constraints.length, 0);
    });
  });

  describe("Validation Rules", () => {
    it("Should not allow setting isFree=true with prices", async () => {
      const event = await insertEvent();
      const currency = await insertAllowedCurrency({
        currency: "USD",
      });
      const addon = await insertAddon({
        name: "Paid Addon",
        eventId: event.id,
        isFree: false,
      });

      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateAddonMutation,
        UpdateAddonMutationVariables
      >({
        document: UpdateAddon,
        variables: {
          input: {
            id: addon.id,
            isFree: true,
            prices: [
              {
                value_in_cents: 1000,
                currencyId: currency.id,
              },
            ],
          },
        },
      });

      assert.exists(response.errors);

      assert.include(
        response.errors?.[0].message.toLowerCase(),
        "addon cannot be free and have prices",
      );
    });
  });

  describe("Price Updates", () => {
    it("Should allow updating existing prices and adding new ones", async () => {
      const event = await insertEvent();
      const usdCurrency = await insertAllowedCurrency({ currency: "USD" });
      const eurCurrency = await insertAllowedCurrency({ currency: "EUR" });

      const addon = await insertAddon({
        name: "Paid Addon",
        eventId: event.id,
        isFree: false,
      });

      const usdPrice = await insertPrice({
        price_in_cents: 1000,
        currencyId: usdCurrency.id,
      });

      await insertAddonPrice({
        addonId: addon.id,
        priceId: usdPrice.id,
      });

      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateAddonMutation,
        UpdateAddonMutationVariables
      >({
        document: UpdateAddon,
        variables: {
          input: {
            id: addon.id,
            prices: [
              {
                value_in_cents: 2000,
                currencyId: usdCurrency.id,
              },
              {
                value_in_cents: 1800, // Add new EUR price
                currencyId: eurCurrency.id,
              },
            ],
          },
        },
      });

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.updateAddon?.prices.length, 2);

      assert.equal(response.data?.updateAddon?.prices[0].amount, 2000);
    });
  });

  describe("Ticket Constraints", () => {
    it("Should fail when adding constraint with mismatched tickets", async () => {
      const event = await insertEvent();
      const ticket1 = await insertTicketTemplate({ eventId: event.id });
      const ticket2 = await insertTicketTemplate({ eventId: event.id });

      const addon1 = await insertAddon({
        name: "Addon 1",
        eventId: event.id,
      });
      const addon2 = await insertAddon({
        name: "Addon 2",
        eventId: event.id,
      });

      // Add addon1 to both tickets but addon2 only to ticket1
      await insertTicketAddon({
        addonId: addon1.id,
        ticketId: ticket1.id,
        orderDisplay: 1,
      });

      await insertTicketAddon({
        addonId: addon1.id,
        ticketId: ticket2.id,
        orderDisplay: 1,
      });

      await insertTicketAddon({
        addonId: addon2.id,
        ticketId: ticket1.id,
        orderDisplay: 2,
      });

      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateAddonMutation,
        UpdateAddonMutationVariables
      >({
        document: UpdateAddon,
        variables: {
          input: {
            id: addon1.id,
            newConstraints: [
              {
                relatedAddonId: addon2.id,
                constraintType: GraphQLAddonConstraintType.Dependency,
              },
            ],
          },
        },
      });

      assert.exists(response.errors);

      assert.include(
        response.errors?.[0].message.toLowerCase(),
        `addons with ids ${addon2.id} are not available in the same tickets`,
      );
    });

    it("Should handle ticket deletion with multiple related tickets", async () => {
      const event = await insertEvent();
      const ticket1 = await insertTicketTemplate({ eventId: event.id });
      const ticket2 = await insertTicketTemplate({ eventId: event.id });

      const addon1 = await insertAddon({
        name: "Addon 1",
        eventId: event.id,
      });
      const addon2 = await insertAddon({
        name: "Addon 2",
        eventId: event.id,
      });

      // Add both addons to both tickets
      await insertTicketAddon({
        addonId: addon1.id,
        ticketId: ticket1.id,
        orderDisplay: 1,
      });

      await insertTicketAddon({
        addonId: addon1.id,
        ticketId: ticket2.id,
        orderDisplay: 1,
      });

      await insertTicketAddon({
        addonId: addon2.id,
        ticketId: ticket1.id,
        orderDisplay: 2,
      });

      await insertTicketAddon({
        addonId: addon2.id,
        ticketId: ticket2.id,
        orderDisplay: 2,
      });

      await insertAddonConstraint({
        addonId: addon1.id,
        relatedAddonId: addon2.id,
        constraintType: AddonConstraintType.DEPENDENCY,
      });

      // Delete ticket1 - should succeed as constraint still valid through ticket2

      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateAddonMutation,
        UpdateAddonMutationVariables
      >({
        document: UpdateAddon,
        variables: {
          input: { id: addon1.id, deleteTicketIds: [ticket1.id] },
        },
      });

      assert.equal(response.errors, undefined);

      // Verify DB state
      const DB = await getTestDB();
      const constraints = await DB.query.addonConstraintsSchema.findMany({
        where: (ac, { eq }) => eq(ac.addonId, addon1.id),
      });

      assert.equal(constraints.length, 1);
    });
  });
});
