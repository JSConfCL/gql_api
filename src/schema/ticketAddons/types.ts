import { builder } from "~/builder";
import {
  AddonConstraintType,
  SelectAddonConstraintSchema,
  SelectAddonSchema,
  selectAddonSchema,
  SelectTicketAddonSchema,
} from "~/datasources/db/ticketAddons";
import {
  SelectUserTicketAddonSchema,
  UserTicketAddonApprovalStatus,
  UserTicketAddonRedemptionStatus,
} from "~/datasources/db/userTicketsAddons";
import { PriceRef } from "~/schema/shared/refs";

import { RESERVED_USER_TICKET_ADDON_APPROVAL_STATUSES } from "./constants";
import { PurchaseOrderLoadable } from "../purchaseOrder/types";
import { TicketLoadable } from "../ticket/types";
import { UserTicketLoadable } from "../userTickets/types";

export const AddonConstraintTypeEnum = builder.enumType(AddonConstraintType, {
  name: "AddonConstraintType",
});

export const UserTicketAddonStatusEnum = builder.enumType(
  UserTicketAddonRedemptionStatus,
  {
    name: "UserTicketAddonStatus",
  },
);

export const UserTicketAddonApprovalStatusEnum = builder.enumType(
  UserTicketAddonApprovalStatus,
  {
    name: "UserTicketAddonApprovalStatus",
  },
);

export const AddonRef = builder.objectRef<SelectAddonSchema>("Addon");

const AddonLoadable = builder.loadableObject(AddonRef, {
  load: async (ids: string[], ctx) => {
    const results = await ctx.DB.query.addonsSchema.findMany({
      where: (addons, { inArray }) => inArray(addons.id, ids),
    });

    const idsToResultsMap: Map<string, SelectAddonSchema> = new Map();

    results.forEach((result) => {
      idsToResultsMap.set(result.id, result);
    });

    return ids.map((id) => {
      const result = idsToResultsMap.get(id);

      if (!result) {
        throw new Error("Addon not found");
      }

      return result;
    });
  },
  description: "Representation of an Addon",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    maxPerTicket: t.exposeInt("maxPerTicket", { nullable: true }),
    isFree: t.exposeBoolean("isFree"),
    isUnlimited: t.exposeBoolean("isUnlimited"),
    prices: t.field({
      type: [PriceRef],
      resolve: async (root, _, { DB }) => {
        if (root.isFree) {
          return [];
        }

        const result = await DB.query.addonsPricesSchema.findMany({
          where: (ticketsAddonsPrices, { eq }) =>
            eq(ticketsAddonsPrices.addonId, root.id),
          with: {
            price: true,
          },
        });

        return result.map((price) => ({
          id: price.price.id,
          amount: price.price.price_in_cents,
          currencyId: price.price.currencyId,
        }));
      },
    }),
    totalStock: t.exposeInt("totalStock", { nullable: true }),
    availableStock: t.field({
      type: "Int",
      nullable: true,
      resolve: async (root, _, { DB }) => {
        if (root.isUnlimited) {
          return null;
        }

        if (root.totalStock === null) {
          return null;
        }

        const userTicketAddons = await DB.query.userTicketAddonsSchema.findMany(
          {
            where: (ut, ops) =>
              ops.and(
                ops.eq(ut.addonId, root.id),
                ops.inArray(
                  ut.approvalStatus,
                  RESERVED_USER_TICKET_ADDON_APPROVAL_STATUSES,
                ),
              ),
          },
        );

        return root.totalStock - userTicketAddons.length;
      },
    }),
    ticketAddons: t.field({
      type: [TicketAddonRef],
      resolve: async (root, _, { DB }) => {
        return DB.query.ticketAddonsSchema.findMany({
          where: (t, { eq }) => eq(t.addonId, root.id),
        });
      },
    }),
    constraints: t.field({
      type: [AddonConstraintRef],
      resolve: async (root, _, { DB }) => {
        return DB.query.addonConstraintsSchema.findMany({
          where: (t, { eq }) => eq(t.addonId, root.id),
        });
      },
    }),
  }),
});

export const TicketAddonRef =
  builder.objectRef<SelectTicketAddonSchema>("TicketAddon");

builder.objectType(TicketAddonRef, {
  description: "Representation of a Ticket Addon",
  fields: (t) => ({
    id: t.exposeID("id"),
    addonId: t.exposeID("addonId"),
    ticketId: t.exposeID("ticketId"),
    orderDisplay: t.exposeInt("orderDisplay"),
    addon: t.field({
      type: AddonLoadable,
      resolve: (root) => root.addonId,
    }),
    ticket: t.field({
      type: TicketLoadable,
      resolve: (root) => root.ticketId,
    }),
  }),
});

export const UserTicketAddonRef =
  builder.objectRef<SelectUserTicketAddonSchema>("UserTicketAddon");

builder.objectType(UserTicketAddonRef, {
  description: "Representation of a User Ticket Addon",
  fields: (t) => ({
    id: t.exposeID("id"),
    userTicketId: t.exposeID("userTicketId"),
    addonId: t.exposeID("addonId"),
    quantity: t.exposeInt("quantity"),
    unitPriceInCents: t.exposeInt("unitPriceInCents"),
    redemptionStatus: t.expose("redemptionStatus", {
      type: UserTicketAddonStatusEnum,
    }),
    approvalStatus: t.expose("approvalStatus", {
      type: UserTicketAddonApprovalStatusEnum,
    }),
    purchaseOrderId: t.exposeID("purchaseOrderId"),
    userTicket: t.field({
      type: UserTicketLoadable,
      resolve: (root) => root.userTicketId,
    }),
    addon: t.field({
      type: AddonLoadable,
      resolve: (root) => root.addonId,
    }),
    purchaseOrder: t.field({
      type: PurchaseOrderLoadable,
      resolve: (root) => root.purchaseOrderId,
    }),
  }),
});

export const AddonConstraintRef =
  builder.objectRef<SelectAddonConstraintSchema>("AddonConstraint");

builder.objectType(AddonConstraintRef, {
  description: "Representation of an Addon Constraint",
  fields: (t) => ({
    id: t.exposeID("id"),
    addonId: t.exposeID("addonId"),
    relatedAddonId: t.exposeID("relatedAddonId"),
    constraintType: t.expose("constraintType", {
      type: AddonConstraintTypeEnum,
    }),
    addon: t.field({
      type: AddonRef,
      resolve: async (root, _, { DB }) => {
        const result = await DB.query.addonsSchema.findFirst({
          where: (addons, { eq }) => eq(addons.id, root.addonId),
        });

        if (!result) {
          throw new Error("Addon not found");
        }

        return selectAddonSchema.parse(result);
      },
    }),
    relatedAddon: t.field({
      type: AddonRef,
      resolve: async (root, _, { DB }) => {
        const result = await DB.query.addonsSchema.findFirst({
          where: (addons, { eq }) => eq(addons.id, root.relatedAddonId),
        });

        if (!result) {
          throw new Error("Related addon not found");
        }

        return selectAddonSchema.parse(result);
      },
    }),
  }),
});
