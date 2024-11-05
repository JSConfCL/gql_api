import { assert, beforeEach, describe, it } from "vitest";

import { AddonConstraintType } from "~/datasources/db/ticketAddons";
import { UserTicketAddonApprovalStatus } from "~/datasources/db/userTicketsAddons";
import { UserTicketAddonApprovalStatus as GraphQLUserTicketAddonApprovalStatus } from "~/generated/types";
import {
  executeGraphqlOperationAsUser,
  insertAddon,
  insertAddonConstraint,
  insertCommunity,
  insertEvent,
  insertEventToCommunity,
  insertTicket,
  insertTicketAddon,
  insertTicketTemplate,
  insertUser,
  insertUserTicketAddon,
  insertPurchaseOrder,
} from "~/tests/fixtures";

import {
  CancelUserTicketAddons,
  CancelUserTicketAddonsMutation,
  CancelUserTicketAddonsMutationVariables,
} from "./cancelUserTicketAddons.generated";

describe("cancelUserTicketAddons mutation", () => {
  beforeEach(() => {
    // Reset any mocks if needed
  });

  it("should successfully cancel a free addon", async () => {
    // Setup
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: true,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const addon = await insertAddon({
      name: "Free Addon",
      description: "Free Addon Description",
      totalStock: 100,
      maxPerTicket: 2,
      isUnlimited: false,
      eventId: event.id,
      isFree: true,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon.id,
      orderDisplay: 1,
    });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "complete",
      totalPrice: "0",
      purchaseOrderPaymentStatus: "not_required",
    });

    const userTicketAddon = await insertUserTicketAddon({
      userTicketId: userTicket.id,
      addonId: addon.id,
      quantity: 1,
      purchaseOrderId: purchaseOrder.id,
      unitPriceInCents: 0,
    });

    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketAddonsMutation,
      CancelUserTicketAddonsMutationVariables
    >(
      {
        document: CancelUserTicketAddons,
        variables: {
          userTicketAddonIds: [userTicketAddon.id],
        },
      },
      user,
    );

    assert.equal(response.errors, undefined);

    const cancelledAddons = response.data?.cancelUserTicketAddons;

    assert.equal(cancelledAddons?.length, 1);

    assert.equal(cancelledAddons?.[0].id, userTicketAddon.id);

    assert.equal(
      cancelledAddons?.[0].approvalStatus,
      GraphQLUserTicketAddonApprovalStatus.Cancelled,
    );
  });

  it("should fail when trying to cancel non-existent addon", async () => {
    const user = await insertUser();

    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketAddonsMutation,
      CancelUserTicketAddonsMutationVariables
    >(
      {
        document: CancelUserTicketAddons,
        variables: {
          userTicketAddonIds: ["non-existent-id"],
        },
      },
      user,
    );

    assert.exists(response.errors);

    assert.include(
      response.errors?.[0].message,
      "Some user ticket addons were not found or don't belong to the user",
    );
  });

  it("should fail when trying to cancel addon that belongs to another user", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user1 = await insertUser();
    const user2 = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket = await insertTicket({
      userId: user1.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const addon = await insertAddon({
      name: "Free Addon",
      eventId: event.id,
      isFree: true,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon.id,
      orderDisplay: 1,
    });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user1.id,
      status: "complete",
      totalPrice: "0",
      purchaseOrderPaymentStatus: "not_required",
    });

    const userTicketAddon = await insertUserTicketAddon({
      userTicketId: userTicket.id,
      addonId: addon.id,
      quantity: 1,
      purchaseOrderId: purchaseOrder.id,
      unitPriceInCents: 0,
    });

    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketAddonsMutation,
      CancelUserTicketAddonsMutationVariables
    >(
      {
        document: CancelUserTicketAddons,
        variables: {
          userTicketAddonIds: [userTicketAddon.id],
        },
      },
      user2,
    );

    assert.exists(response.errors);

    assert.include(
      response.errors?.[0].message,
      "Some user ticket addons were not found or don't belong to the user",
    );
  });

  it("should fail when trying to cancel an addon that other addons depend on", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const baseAddon = await insertAddon({
      name: "Base Addon",
      eventId: event.id,
      isFree: true,
    });

    const dependentAddon = await insertAddon({
      name: "Dependent Addon",
      eventId: event.id,
      isFree: true,
    });

    // Set up dependency constraint
    await insertAddonConstraint({
      addonId: dependentAddon.id,
      relatedAddonId: baseAddon.id,
      constraintType: AddonConstraintType.DEPENDENCY,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: baseAddon.id,
      orderDisplay: 1,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: dependentAddon.id,
      orderDisplay: 2,
    });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "complete",
      totalPrice: "0",
      purchaseOrderPaymentStatus: "not_required",
    });

    const baseUserTicketAddon = await insertUserTicketAddon({
      userTicketId: userTicket.id,
      addonId: baseAddon.id,
      quantity: 1,
      purchaseOrderId: purchaseOrder.id,
      unitPriceInCents: 0,
      approvalStatus: UserTicketAddonApprovalStatus.APPROVED,
    });

    await insertUserTicketAddon({
      userTicketId: userTicket.id,
      addonId: dependentAddon.id,
      quantity: 1,
      purchaseOrderId: purchaseOrder.id,
      unitPriceInCents: 0,
      approvalStatus: UserTicketAddonApprovalStatus.APPROVED,
    });

    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketAddonsMutation,
      CancelUserTicketAddonsMutationVariables
    >(
      {
        document: CancelUserTicketAddons,
        variables: {
          userTicketAddonIds: [baseUserTicketAddon.id],
        },
      },
      user,
    );

    assert.exists(response.errors);

    assert.include(response.errors?.[0].message, "Cannot cancel addon");

    assert.include(
      response.errors?.[0].message,
      "because other addons depend on it",
    );
  });

  it("should fail when trying to cancel a paid addon", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const addon = await insertAddon({
      name: "Paid Addon",
      eventId: event.id,
      isFree: false,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon.id,
      orderDisplay: 1,
    });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "complete",
      totalPrice: "1000",
      purchaseOrderPaymentStatus: "paid",
      paymentPlatform: "stripe",
    });

    const userTicketAddon = await insertUserTicketAddon({
      userTicketId: userTicket.id,
      addonId: addon.id,
      quantity: 1,
      purchaseOrderId: purchaseOrder.id,
      unitPriceInCents: 1000,
    });

    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketAddonsMutation,
      CancelUserTicketAddonsMutationVariables
    >(
      {
        document: CancelUserTicketAddons,
        variables: {
          userTicketAddonIds: [userTicketAddon.id],
        },
      },
      user,
    );

    assert.exists(response.errors);

    assert.include(
      response.errors?.[0].message,
      "Cancellation of paid addons is not supported yet",
    );
  });

  it("should fail when no addon IDs are provided", async () => {
    const user = await insertUser();

    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketAddonsMutation,
      CancelUserTicketAddonsMutationVariables
    >(
      {
        document: CancelUserTicketAddons,
        variables: {
          userTicketAddonIds: [],
        },
      },
      user,
    );

    assert.exists(response.errors);

    assert.include(
      response.errors?.[0].message,
      "No user ticket addons provided",
    );
  });

  it("should successfully cancel multiple free addons", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const addon1 = await insertAddon({
      name: "Free Addon 1",
      eventId: event.id,
      isFree: true,
    });

    const addon2 = await insertAddon({
      name: "Free Addon 2",
      eventId: event.id,
      isFree: true,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon1.id,
      orderDisplay: 1,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon2.id,
      orderDisplay: 2,
    });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "complete",
      totalPrice: "0",
      purchaseOrderPaymentStatus: "not_required",
    });

    const userTicketAddon1 = await insertUserTicketAddon({
      userTicketId: userTicket.id,
      addonId: addon1.id,
      quantity: 1,
      purchaseOrderId: purchaseOrder.id,
      unitPriceInCents: 0,
    });

    const userTicketAddon2 = await insertUserTicketAddon({
      userTicketId: userTicket.id,
      addonId: addon2.id,
      quantity: 1,
      purchaseOrderId: purchaseOrder.id,
      unitPriceInCents: 0,
    });

    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketAddonsMutation,
      CancelUserTicketAddonsMutationVariables
    >(
      {
        document: CancelUserTicketAddons,
        variables: {
          userTicketAddonIds: [userTicketAddon1.id, userTicketAddon2.id],
        },
      },
      user,
    );

    assert.equal(response.errors, undefined);

    const cancelledAddons = response.data?.cancelUserTicketAddons;

    assert.equal(cancelledAddons?.length, 2);

    assert.equal(cancelledAddons?.[0].id, userTicketAddon1.id);

    assert.equal(
      cancelledAddons?.[0].approvalStatus,
      GraphQLUserTicketAddonApprovalStatus.Cancelled,
    );

    assert.equal(cancelledAddons?.[1].id, userTicketAddon2.id);

    assert.equal(
      cancelledAddons?.[1].approvalStatus,
      GraphQLUserTicketAddonApprovalStatus.Cancelled,
    );
  });

  it("should fail when trying to cancel already cancelled addons", async () => {
    // Setup
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
      isFree: true,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const addon = await insertAddon({
      name: "Free Addon",
      eventId: event.id,
      isFree: true,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: addon.id,
      orderDisplay: 1,
    });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "complete",
      totalPrice: "0",
      purchaseOrderPaymentStatus: "not_required",
    });

    const userTicketAddon = await insertUserTicketAddon({
      userTicketId: userTicket.id,
      addonId: addon.id,
      quantity: 1,
      purchaseOrderId: purchaseOrder.id,
      unitPriceInCents: 0,
      approvalStatus: UserTicketAddonApprovalStatus.CANCELLED,
    });

    const response = await executeGraphqlOperationAsUser<
      CancelUserTicketAddonsMutation,
      CancelUserTicketAddonsMutationVariables
    >(
      {
        document: CancelUserTicketAddons,
        variables: {
          userTicketAddonIds: [userTicketAddon.id],
        },
      },
      user,
    );

    assert.exists(response.errors);

    assert.include(
      response.errors?.[0].message,
      "Some addons are already cancelled",
    );
  });

  it("should allow cancelling base addon after dependent addon is cancelled", async () => {
    const community = await insertCommunity();
    const event = await insertEvent();
    const user = await insertUser();

    await insertEventToCommunity({
      eventId: event.id,
      communityId: community.id,
    });

    const ticket = await insertTicketTemplate({
      eventId: event.id,
      quantity: 100,
    });

    const userTicket = await insertTicket({
      userId: user.id,
      ticketTemplateId: ticket.id,
      approvalStatus: "approved",
    });

    const baseAddon = await insertAddon({
      name: "Base Addon",
      eventId: event.id,
      isFree: true,
    });

    const dependentAddon = await insertAddon({
      name: "Dependent Addon",
      eventId: event.id,
      isFree: true,
    });

    // Set up dependency constraint
    await insertAddonConstraint({
      addonId: dependentAddon.id,
      relatedAddonId: baseAddon.id,
      constraintType: AddonConstraintType.DEPENDENCY,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: baseAddon.id,
      orderDisplay: 1,
    });

    await insertTicketAddon({
      ticketId: ticket.id,
      addonId: dependentAddon.id,
      orderDisplay: 2,
    });

    const purchaseOrder = await insertPurchaseOrder({
      userId: user.id,
      status: "complete",
      totalPrice: "0",
      purchaseOrderPaymentStatus: "not_required",
    });

    const baseUserTicketAddon = await insertUserTicketAddon({
      userTicketId: userTicket.id,
      addonId: baseAddon.id,
      quantity: 1,
      purchaseOrderId: purchaseOrder.id,
      unitPriceInCents: 0,
      approvalStatus: UserTicketAddonApprovalStatus.APPROVED,
    });

    const dependentUserTicketAddon = await insertUserTicketAddon({
      userTicketId: userTicket.id,
      addonId: dependentAddon.id,
      quantity: 1,
      purchaseOrderId: purchaseOrder.id,
      unitPriceInCents: 0,
      approvalStatus: UserTicketAddonApprovalStatus.APPROVED,
    });

    // First attempt: Try to cancel base addon while dependent is active
    const firstResponse = await executeGraphqlOperationAsUser<
      CancelUserTicketAddonsMutation,
      CancelUserTicketAddonsMutationVariables
    >(
      {
        document: CancelUserTicketAddons,
        variables: {
          userTicketAddonIds: [baseUserTicketAddon.id],
        },
      },
      user,
    );

    assert.exists(firstResponse.errors);

    assert.include(firstResponse.errors?.[0].message, "Cannot cancel addon");

    assert.include(
      firstResponse.errors?.[0].message,
      "because other addons depend on it",
    );

    // Second attempt: Cancel the dependent addon
    const secondResponse = await executeGraphqlOperationAsUser<
      CancelUserTicketAddonsMutation,
      CancelUserTicketAddonsMutationVariables
    >(
      {
        document: CancelUserTicketAddons,
        variables: {
          userTicketAddonIds: [dependentUserTicketAddon.id],
        },
      },
      user,
    );

    assert.equal(secondResponse.errors, undefined);
    const cancelledDependentAddons =
      secondResponse.data?.cancelUserTicketAddons;

    assert.equal(cancelledDependentAddons?.length, 1);

    assert.equal(cancelledDependentAddons?.[0].id, dependentUserTicketAddon.id);

    assert.equal(
      cancelledDependentAddons?.[0].approvalStatus,
      GraphQLUserTicketAddonApprovalStatus.Cancelled,
    );

    // Third attempt: Now try to cancel base addon
    const thirdResponse = await executeGraphqlOperationAsUser<
      CancelUserTicketAddonsMutation,
      CancelUserTicketAddonsMutationVariables
    >(
      {
        document: CancelUserTicketAddons,
        variables: {
          userTicketAddonIds: [baseUserTicketAddon.id],
        },
      },
      user,
    );

    assert.equal(thirdResponse.errors, undefined);
    const cancelledBaseAddons = thirdResponse.data?.cancelUserTicketAddons;

    assert.equal(cancelledBaseAddons?.length, 1);

    assert.equal(cancelledBaseAddons?.[0].id, baseUserTicketAddon.id);

    assert.equal(
      cancelledBaseAddons?.[0].approvalStatus,
      GraphQLUserTicketAddonApprovalStatus.Cancelled,
    );
  });
});
