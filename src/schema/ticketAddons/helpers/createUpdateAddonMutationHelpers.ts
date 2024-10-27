import { and, eq, inArray, sql } from "drizzle-orm";

import { builder } from "~/builder";
import { TRANSACTION_HANDLER } from "~/datasources/db";
import { pricesSchema } from "~/datasources/db/prices";
import {
  ticketAddonsSchema,
  addonConstraintsSchema,
  InsertTicketAddonSchema,
  InsertAddonConstraintSchema,
} from "~/datasources/db/ticketAddons";
import { ticketsSchema } from "~/datasources/db/tickets";
import {
  addonsPricesSchema,
  InsertAddonPriceSchema,
} from "~/datasources/db/ticketsAddonsPrices";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";
import { InferPothosInputType } from "~/types";

import { validateAddonConstraints } from "./validateAddonConstraints";
import { PricingInputFieldRef } from "../../shared/refs";
import {
  CreateAddonConstraintInputRef,
  AddonInputTicketRef,
  AddonTicketUpdateInputRef,
  UpdateAddonConstraintInputRef,
} from "../mutations";

const validateTicketsForEvent = async (
  tx: TRANSACTION_HANDLER,
  ticketIds: string[],
  eventId: string,
  logger: Logger,
): Promise<void> => {
  const tickets = await tx.query.ticketsSchema.findMany({
    where: (etc, ops) => {
      return ops.and(
        inArray(ticketsSchema.id, ticketIds),
        eq(ticketsSchema.eventId, eventId),
      );
    },
    columns: {
      id: true,
    },
  });

  const invalidTickets = ticketIds.filter(
    (ticketId) => !tickets.some((t) => t.id === ticketId),
  );

  if (invalidTickets.length > 0) {
    throw applicationError(
      `Tickets ${invalidTickets.join(
        ", ",
      )} do not belong to the specified event`,
      ServiceErrors.INVALID_ARGUMENT,
      logger,
    );
  }
};

const createAndAssociatePrices = async (
  tx: TRANSACTION_HANDLER,
  addonId: string,
  prices: InferPothosInputType<typeof builder, typeof PricingInputFieldRef>[],
  logger: Logger,
): Promise<void> => {
  const insertedPricesToAddonsPrices: InsertAddonPriceSchema[] = [];

  await Promise.all(
    prices.map(async (price) => {
      const [insertedPrice] = await tx
        .insert(pricesSchema)
        .values({
          price_in_cents: price.value_in_cents,
          currencyId: price.currencyId,
        })
        .returning();

      if (!insertedPrice) {
        throw applicationError(
          "Failed to insert price",
          ServiceErrors.INTERNAL_SERVER_ERROR,
          logger,
        );
      }

      insertedPricesToAddonsPrices.push({
        addonId,
        priceId: insertedPrice.id,
      });
    }),
  );

  await tx.insert(addonsPricesSchema).values(insertedPricesToAddonsPrices);
};

const associateTicketsWithAddon = async (
  tx: TRANSACTION_HANDLER,
  addonId: string,
  tickets: { ticketId: string; orderDisplay: number }[],
): Promise<void> => {
  const insertTicketAddons: InsertTicketAddonSchema[] = tickets.map(
    (ticket) => ({
      ticketId: ticket.ticketId,
      addonId,
      orderDisplay: ticket.orderDisplay,
    }),
  );

  await tx.insert(ticketAddonsSchema).values(insertTicketAddons);
};

const handleNewConstraints = async (
  logger: Logger,
  tx: TRANSACTION_HANDLER,
  addonId: string,
  ticketId: string,
  constraints:
    | InferPothosInputType<
        typeof builder,
        typeof CreateAddonConstraintInputRef
      >[]
    | null,
): Promise<void> => {
  if (constraints && constraints.length > 0) {
    await validateAddonConstraints(logger, tx, addonId, constraints, ticketId);

    const insertConstraints: InsertAddonConstraintSchema[] = constraints.map(
      (constraint) => ({
        addonId,
        relatedAddonId: constraint.relatedAddonId,
        constraintType: constraint.constraintType,
      }),
    );

    await tx.insert(addonConstraintsSchema).values(insertConstraints);
  }
};

const handleUpdateConstraints = async (
  logger: Logger,
  tx: TRANSACTION_HANDLER,
  addonId: string,
  ticketId: string,
  constraints:
    | InferPothosInputType<
        typeof builder,
        typeof UpdateAddonConstraintInputRef
      >[]
    | null,
): Promise<void> => {
  if (constraints && constraints.length > 0) {
    await validateAddonConstraints(logger, tx, addonId, constraints, ticketId);

    const updateSql = sql`
      UPDATE ${addonConstraintsSchema}
      SET 
        ${sql.raw(
          addonConstraintsSchema.relatedAddonId.name,
        )} = tmp.related_addon_id::uuid,
        ${sql.raw(
          addonConstraintsSchema.constraintType.name,
        )} = tmp.constraint_type::text
      FROM (
        VALUES
          ${sql.join(
            constraints.map(
              (c) =>
                sql`(${c.id}::uuid, ${c.relatedAddonId}::uuid, ${c.constraintType}::text)`,
            ),
            ",",
          )}
      ) AS tmp (id, related_addon_id, constraint_type)
      WHERE 
        ${addonConstraintsSchema}.${sql.raw(
          addonConstraintsSchema.id.name,
        )} = tmp.id
        AND ${addonConstraintsSchema}.${sql.raw(
          addonConstraintsSchema.addonId.name,
        )} = ${addonId}::uuid
    `;

    await tx.execute(updateSql);
  }
};

export const createUpdateAddonMutationHelpers = {
  validateBaseData: (
    logger: Logger,
    data: {
      isFree: boolean | undefined | null;
      maxPerTicket: number | undefined | null;
      totalStock: number | undefined | null;
      prices:
        | {
            currencyId: string | undefined | null;
          }[]
        | undefined
        | null;
      isUnlimited: boolean | undefined | null;
    },
  ) => {
    if (data.isFree && data.prices && data.prices.length > 0) {
      throw applicationError(
        "Addon cannot be free and have prices",
        ServiceErrors.INVALID_ARGUMENT,
        logger,
      );
    }

    if (typeof data.maxPerTicket === "number" && data.maxPerTicket < 0) {
      throw applicationError(
        "Max per ticket cannot be negative",
        ServiceErrors.INVALID_ARGUMENT,
        logger,
      );
    }

    if (typeof data.totalStock === "number" && data.totalStock < 0) {
      throw applicationError(
        "Total stock cannot be negative",
        ServiceErrors.INVALID_ARGUMENT,
        logger,
      );
    }

    if (
      typeof data.isUnlimited === "boolean" &&
      !data.isUnlimited &&
      typeof data.totalStock !== "number"
    ) {
      throw applicationError(
        "Total stock is required if addon is not unlimited",
        ServiceErrors.INVALID_ARGUMENT,
        logger,
      );
    }
  },

  handlePrices: async (
    logger: Logger,
    tx: TRANSACTION_HANDLER,
    addonId: string,
    prices?:
      | InferPothosInputType<typeof builder, typeof PricingInputFieldRef>[]
      | null,
  ): Promise<void> => {
    if (prices && prices.length > 0) {
      await createAndAssociatePrices(tx, addonId, prices, logger);
    }
  },

  handleNewTickets: async (
    logger: Logger,
    tx: TRANSACTION_HANDLER,
    addonId: string,
    eventId: string,
    tickets?:
      | InferPothosInputType<typeof builder, typeof AddonInputTicketRef>[]
      | null,
  ): Promise<void> => {
    if (tickets && tickets.length > 0) {
      await validateTicketsForEvent(
        tx,
        tickets.map((t) => t.ticketId),
        eventId,
        logger,
      );

      await associateTicketsWithAddon(tx, addonId, tickets);
    }

    const constraintsPromise = tickets?.map((ticket) =>
      handleNewConstraints(
        logger,
        tx,
        addonId,
        ticket.ticketId,
        ticket.constraints || null,
      ),
    );

    if (constraintsPromise) {
      await Promise.all(constraintsPromise);
    }
  },

  deletePrices: async (
    tx: TRANSACTION_HANDLER,
    addonId: string,
    priceIds: string[],
  ): Promise<void> => {
    const deletedAddonsPrices = await tx
      .delete(addonsPricesSchema)
      .where(
        and(
          eq(addonsPricesSchema.addonId, addonId),
          inArray(addonsPricesSchema.priceId, priceIds),
        ),
      )
      .returning({ id: addonsPricesSchema.id });

    await tx.delete(pricesSchema).where(
      inArray(
        pricesSchema.id,
        deletedAddonsPrices.map((price) => price.id),
      ),
    );
  },

  handleUpdatePrices: async (
    logger: Logger,
    tx: TRANSACTION_HANDLER,
    addonId: string,
    prices?:
      | InferPothosInputType<typeof builder, typeof PricingInputFieldRef>[]
      | null,
    deletePriceIds?: string[] | null,
  ): Promise<void> => {
    if (deletePriceIds && deletePriceIds.length > 0) {
      await createUpdateAddonMutationHelpers.deletePrices(
        tx,
        addonId,
        deletePriceIds,
      );
    }

    if (prices && prices.length > 0) {
      await createAndAssociatePrices(tx, addonId, prices, logger);
    }
  },

  handleUpdateTickets: async (
    logger: Logger,
    tx: TRANSACTION_HANDLER,
    addonId: string,
    eventId: string,
    tickets:
      | InferPothosInputType<typeof builder, typeof AddonTicketUpdateInputRef>[]
      | null,
    deleteTicketIds: string[] | null,
  ): Promise<void> => {
    if (deleteTicketIds && deleteTicketIds.length > 0) {
      await tx
        .delete(ticketAddonsSchema)
        .where(
          and(
            eq(ticketAddonsSchema.addonId, addonId),
            inArray(ticketAddonsSchema.ticketId, deleteTicketIds),
          ),
        );
    }

    const deleteConstraintIds = tickets
      ?.map((t) => t.constraints?.idsToDelete || [])
      .flat();

    if (deleteConstraintIds && deleteConstraintIds.length > 0) {
      await tx
        .delete(addonConstraintsSchema)
        .where(
          and(
            eq(addonConstraintsSchema.addonId, addonId),
            inArray(addonConstraintsSchema.id, deleteConstraintIds),
          ),
        );
    }

    const newConstraintsPromise = tickets?.map((ticket) =>
      handleNewConstraints(
        logger,
        tx,
        addonId,
        ticket.ticketId,
        ticket.constraints?.create || null,
      ),
    );

    if (newConstraintsPromise) {
      await Promise.all(newConstraintsPromise);
    }

    const updateConstraintsPromise = tickets?.map((ticket) =>
      handleUpdateConstraints(
        logger,
        tx,
        addonId,
        ticket.ticketId,
        ticket.constraints?.update || null,
      ),
    );

    if (updateConstraintsPromise) {
      await Promise.all(updateConstraintsPromise);
    }
  },
};
