import { builder } from "~/builder";
import {
  AddonConstraintType,
  SelectAddonConstraintSchema,
  SelectAddonSchema,
  selectAddonSchema,
  SelectTicketAddonSchema,
} from "~/datasources/db/ticketAddons";
import { SelectTicketSchema } from "~/datasources/db/tickets";
import { SelectUserTicketSchema } from "~/datasources/db/userTickets";
import {
  SelectUserTicketAddonSchema,
  UserTicketAddonApprovalStatus,
  UserTicketAddonRedemptionStatus,
} from "~/datasources/db/userTicketsAddons";
import { TicketRef, UserTicketRef, PriceRef } from "~/schema/shared/refs";

import { RESERVED_USER_TICKET_ADDON_APPROVAL_STATUSES } from "./constants";
import { PurchaseOrderLoadable } from "../purchaseOrder/types";

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

builder.objectType(AddonRef, {
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
    addon: t.loadable({
      type: AddonRef,
      load: async (ids: string[], ctx) => {
        const idToAddonMap: Record<string, SelectAddonSchema> = {};

        const result = await ctx.DB.query.addonsSchema.findMany({
          where: (addons, { inArray }) => inArray(addons.id, ids),
        });

        result.forEach((addon) => {
          idToAddonMap[addon.id] = addon;
        });

        return ids.map(
          (id) => idToAddonMap[id] || new Error(`Addon ${id} not found`),
        );
      },
      resolve: (root) => root.addonId,
    }),
    ticket: t.loadable({
      type: TicketRef,
      load: async (ids: string[], ctx) => {
        const idToTicketMap: Record<string, SelectTicketSchema> = {};

        const result = await ctx.DB.query.ticketsSchema.findMany({
          where: (tickets, { inArray }) => inArray(tickets.id, ids),
        });

        result.forEach((ticket) => {
          idToTicketMap[ticket.id] = ticket;
        });

        return ids.map(
          (id) => idToTicketMap[id] || new Error(`Ticket ${id} not found`),
        );
      },
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
    userTicket: t.loadable({
      type: UserTicketRef,
      load: async (ids: string[], { DB }) => {
        const idToUserTicketMap: Record<string, SelectUserTicketSchema> = {};

        const result = await DB.query.userTicketsSchema.findMany({
          where: (userTickets, ops) => {
            return ops.inArray(userTickets.id, ids);
          },
        });

        result.forEach((userTicket) => {
          idToUserTicketMap[userTicket.id] = userTicket;
        });

        return ids.map(
          (id) =>
            idToUserTicketMap[id] || new Error(`User ticket ${id} not found`),
        );
      },
      resolve: (root) => root.userTicketId,
    }),
    addon: t.loadable({
      type: AddonRef,
      load: async (ids: string[], { DB }) => {
        const idToAddonMap: Record<string, SelectAddonSchema> = {};

        const result = await DB.query.addonsSchema.findMany({
          where: (addons, ops) => {
            return ops.inArray(addons.id, ids);
          },
        });

        result.forEach((addon) => {
          idToAddonMap[addon.id] = addon;
        });

        return ids.map(
          (id) => idToAddonMap[id] || new Error(`Addon ${id} not found`),
        );
      },
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
