import { eq, inArray } from "drizzle-orm";

import { builder } from "~/builder";
import {
  addonsSchema,
  InsertAddonSchema,
  SelectAddonSchema,
} from "~/datasources/db/ticketAddons";

import { createUpdateAddonMutationHelpers } from "./helpers/createUpdateAddonMutationHelpers";
import { AddonConstraintTypeEnum, AddonRef } from "./types";
import { addToObjectIfPropertyExists } from "../shared/helpers";
import { PricingInputFieldRef } from "../shared/refs";

// Input type definitions
export const AddonInputTicketRef = builder.inputType("AddonInputTicket", {
  fields: (t) => ({
    ticketId: t.string({ required: true }),
    orderDisplay: t.int({ required: true }),
  }),
});

export const AddonInputRef = builder.inputType("AddonInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    tags: t.field({ type: ["String"], required: false }),
    description: t.string({ required: false }),
    maxPerTicket: t.int({ required: false }),
    totalStock: t.int({ required: false }),
    isUnlimited: t.boolean({
      required: true,
      description: "If true, totalStock must not be passed.",
    }),
    isFree: t.boolean({
      required: true,
      description: "Cannot be true if prices are passed.",
    }),
    eventId: t.string({ required: true }),
    prices: t.field({ type: [PricingInputFieldRef], required: false }),
    tickets: t.field({
      type: [AddonInputTicketRef],
      required: false,
    }),
    constraints: t.field({
      type: [CreateAddonConstraintInputRef],
      required: false,
    }),
  }),
});

export const CreateAddonConstraintInputRef = builder.inputType(
  "CreateAddonConstraintInput",
  {
    fields: (t) => ({
      relatedAddonId: t.string({ required: true }),
      constraintType: t.field({
        type: AddonConstraintTypeEnum,
        required: true,
      }),
    }),
  },
);

export const UpdateAddonConstraintInputRef = builder.inputType(
  "UpdateAddonConstraintInput",
  {
    fields: (t) => ({
      id: t.string({ required: true }),
      relatedAddonId: t.string({ required: true }),
      constraintType: t.field({
        type: AddonConstraintTypeEnum,
        required: true,
      }),
    }),
  },
);

// Main update input remains the same
const UpdateAddonInputRef = builder.inputType("UpdateAddonInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ required: false }),
    tags: t.field({ type: ["String"], required: false }),
    description: t.string({ required: false }),
    maxPerTicket: t.int({ required: false }),
    totalStock: t.int({ required: false }),
    isUnlimited: t.boolean({ required: false }),
    isFree: t.boolean({
      required: false,
      description: "Cannot be true if prices are passed.",
    }),
    prices: t.field({ type: [PricingInputFieldRef], required: false }),
    deletePriceIds: t.field({ type: ["String"], required: false }),
    newTickets: t.field({ type: [AddonInputTicketRef], required: false }),
    updateTickets: t.field({
      type: [AddonInputTicketRef],
      required: false,
    }),
    deleteTicketIds: t.field({ type: ["String"], required: false }),
    newConstraints: t.field({
      type: [CreateAddonConstraintInputRef],
      required: false,
    }),
    updateConstraints: t.field({
      type: [UpdateAddonConstraintInputRef],
      required: false,
    }),
    deleteConstraintIds: t.field({ type: ["String"], required: false }),
  }),
});

builder.mutationField("createAddon", (t) =>
  t.field({
    type: AddonRef,
    args: {
      input: t.arg({ type: AddonInputRef, required: true }),
    },
    authz: {
      rules: ["IsAuthenticated", "IsSuperAdmin"],
    },
    resolve: async (root, { input }, { DB, logger }) => {
      return await DB.transaction(async (tx) => {
        createUpdateAddonMutationHelpers.validateBaseData({
          logger,
          data: {
            isFree: input.isFree,
            maxPerTicket: input.maxPerTicket,
            totalStock: input.totalStock,
            prices: input.prices,
            isUnlimited: input.isUnlimited,
          },
        });

        const [addon] = await tx
          .insert(addonsSchema)
          .values({
            eventId: input.eventId,
            name: input.name,
            description: input.description,
            maxPerTicket: input.maxPerTicket,
            totalStock: input.totalStock,
            isUnlimited: input.isUnlimited,
            isFree: input.isFree,
            tags: input.tags,
          })
          .returning();

        if (!addon) {
          throw new Error("Failed to create addon");
        }

        await Promise.all([
          createUpdateAddonMutationHelpers.handlePricesUpdate({
            logger,
            tx,
            addonId: addon.id,
            params: {
              prices: input.prices || null,
              deletePriceIds: null,
            },
          }),
          createUpdateAddonMutationHelpers.handleTicketsUpdate({
            logger,
            tx,
            params: {
              addonId: addon.id,
              eventId: input.eventId,
              newTickets: input.tickets || null,
              updateTickets: null,
              deleteTicketIds: null,
            },
          }),
        ]);

        // We need to wait till tickets associations are created
        // before creating constraints
        // this to ensure that we only create valid constraints
        // (e.g. related addons are available on the same tickets)
        await createUpdateAddonMutationHelpers.handleConstraintsUpdate({
          logger,
          tx,
          params: {
            addonId: addon.id,
            newConstraints: input.constraints || null,
            updateConstraints: null,
            deleteConstraintIds: null,
          },
        });

        return addon;
      });
    },
  }),
);

builder.mutationField("updateAddon", (t) =>
  t.field({
    type: AddonRef,
    args: {
      input: t.arg({ type: UpdateAddonInputRef, required: true }),
    },
    authz: {
      rules: ["IsAuthenticated", "IsSuperAdmin"],
    },
    resolve: async (root, { input }, { DB, logger }) => {
      return await DB.transaction(async (tx) => {
        const updateData: Partial<InsertAddonSchema> = {};
        const fieldsToUpdate = [
          "name",
          "tags",
          "description",
          "maxPerTicket",
          "totalStock",
          "isUnlimited",
          "isFree",
        ] as const;

        fieldsToUpdate.forEach((field) => {
          addToObjectIfPropertyExists(updateData, field, input[field]);
        });

        let updatedAddon: SelectAddonSchema | undefined;

        if (Object.keys(updateData).length > 0) {
          createUpdateAddonMutationHelpers.validateBaseData({
            logger,
            data: {
              isFree: updateData.isFree,
              maxPerTicket: updateData.maxPerTicket,
              totalStock: updateData.totalStock,
              prices: input.prices,
              isUnlimited: updateData.isUnlimited,
            },
          });

          const result = await tx
            .update(addonsSchema)
            .set(updateData)
            .where(eq(addonsSchema.id, input.id))
            .returning();

          updatedAddon = result?.[0];
        } else {
          updatedAddon = await tx.query.addonsSchema.findFirst({
            where: eq(addonsSchema.id, input.id),
          });
        }

        if (!updatedAddon) {
          throw new Error("Addon not found");
        }

        await Promise.all([
          createUpdateAddonMutationHelpers.handlePricesUpdate({
            logger,
            tx,
            addonId: input.id,
            params: {
              prices: input.prices || null,
              deletePriceIds: input.deletePriceIds || null,
            },
          }),
          createUpdateAddonMutationHelpers.handleTicketsUpdate({
            logger,
            tx,
            params: {
              addonId: updatedAddon.id,
              eventId: updatedAddon.eventId,
              newTickets: input.newTickets || null,
              updateTickets: input.updateTickets || null,
              deleteTicketIds: input.deleteTicketIds || null,
            },
          }),
        ]);

        // maybe the user has deleted some tickets
        // so we need to update the constraints after the tickets are updated
        // just in case the user has deleted some tickets that are related to some constraints
        await createUpdateAddonMutationHelpers.handleConstraintsUpdate({
          logger,
          tx,
          params: {
            addonId: updatedAddon.id,
            newConstraints: input.newConstraints || null,
            updateConstraints: input.updateConstraints || null,
            deleteConstraintIds: input.deleteConstraintIds || null,
          },
        });

        return updatedAddon;
      });
    },
  }),
);

builder.mutationField("deleteAddons", (t) =>
  t.field({
    type: AddonRef,
    args: {
      ids: t.arg({ type: ["String"], required: true }),
    },
    authz: {
      rules: ["IsAuthenticated", "IsSuperAdmin"],
    },
    resolve: async (root, { ids }, { DB }) => {
      return await DB.transaction(async (tx) => {
        const deletedAddon = await tx
          .delete(addonsSchema)
          .where(inArray(addonsSchema.id, ids))
          .returning()
          .then((addon) => addon[0]);

        if (!deletedAddon) {
          throw new Error("No addons found to delete");
        }

        return deletedAddon;
      });
    },
  }),
);
