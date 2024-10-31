import { builder } from "~/builder";
import { selectPurchaseOrdersSchema } from "~/datasources/db/purchaseOrders";
import {
  AddonConstraintType,
  SelectAddonConstraintSchema,
  SelectAddonSchema,
  selectAddonSchema,
  SelectTicketAddonSchema,
} from "~/datasources/db/ticketAddons";
import { selectTicketSchema } from "~/datasources/db/tickets";
import { selectUserTicketsSchema } from "~/datasources/db/userTickets";
import {
  SelectUserTicketAddonSchema,
  UserTicketAddonApprovalStatus,
  UserTicketAddonRedemptionStatus,
} from "~/datasources/db/userTicketsAddons";
import { TicketRef, UserTicketRef, PriceRef } from "~/schema/shared/refs";

import { RESERVED_USER_TICKET_ADDON_APPROVAL_STATUSES } from "./constants";
import { PurchaseOrderRef } from "../purchaseOrder/types";
import { RESERVED_USER_TICKET_APPROVAL_STATUSES } from "../userTickets/constants";

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

        const userTickets = await DB.query.userTicketsSchema.findMany({
          where: (ut, { eq, and, inArray }) =>
            and(
              eq(ut.ticketTemplateId, root.id),
              inArray(
                ut.approvalStatus,
                RESERVED_USER_TICKET_APPROVAL_STATUSES,
              ),
            ),
        });

        if (userTickets.length === 0) {
          return root.totalStock;
        }

        const userTicketAddons = await DB.query.userTicketAddonsSchema.findMany(
          {
            where: (ut, ops) =>
              ops.and(
                ops.eq(ut.addonId, root.id),
                ops.inArray(
                  ut.userTicketId,
                  userTickets.map((ut) => ut.id),
                ),
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
    ticket: t.field({
      type: TicketRef,
      resolve: async (root, _, { DB }) => {
        const result = await DB.query.ticketsSchema.findFirst({
          where: (tickets, { eq }) => eq(tickets.id, root.ticketId),
        });

        if (!result) {
          throw new Error("Ticket not found");
        }

        return selectTicketSchema.parse(result);
      },
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
      type: UserTicketRef,
      resolve: async (root, _, { DB }) => {
        const result = await DB.query.userTicketsSchema.findFirst({
          where: (userTickets, { eq }) => eq(userTickets.id, root.userTicketId),
        });

        if (!result) {
          throw new Error("User ticket not found");
        }

        return selectUserTicketsSchema.parse(result);
      },
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
    purchaseOrder: t.field({
      type: PurchaseOrderRef,
      resolve: async (root, _, { DB }) => {
        const result = await DB.query.purchaseOrdersSchema.findFirst({
          where: (purchaseOrders, { eq }) =>
            eq(purchaseOrders.id, root.purchaseOrderId),
          with: {
            userTickets: {
              columns: {
                id: true,
              },
            },
          },
        });

        if (!result) {
          throw new Error("Purchase order not found");
        }

        return {
          ticketsIds: result.userTickets.map((ut) => ut.id),
          purchaseOrder: selectPurchaseOrdersSchema.parse(result),
        };
      },
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
