import { and, eq, inArray, sql } from "drizzle-orm";

import { builder } from "~/builder";
import { TRANSACTION_HANDLER } from "~/datasources/db";
import { pricesSchema } from "~/datasources/db/prices";
import {
  ticketAddonsSchema,
  addonConstraintsSchema,
  InsertTicketAddonSchema,
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
  UpdateAddonConstraintInputRef,
} from "../mutations";

const priceHelpers = {
  _create: async ({
    tx,
    prices,
    addonId,
    logger,
  }: {
    tx: TRANSACTION_HANDLER;
    prices: InferPothosInputType<typeof builder, typeof PricingInputFieldRef>[];
    addonId: string;
    logger: Logger;
  }): Promise<void> => {
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
  },

  _update: async ({
    tx,
    prices,
  }: {
    tx: TRANSACTION_HANDLER;
    prices: {
      priceId: string;
      value_in_cents: number;
    }[];
    logger: Logger;
  }): Promise<void> => {
    const updateSql = sql`
      UPDATE ${pricesSchema}
      SET ${sql.raw(pricesSchema.price_in_cents.name)} = tmp.value_in_cents::int
      FROM (
        VALUES
          ${sql.join(
            prices.map(
              (p) => sql`(${p.priceId}::uuid, ${p.value_in_cents}::int)`,
            ),
            sql.raw(","),
          )}
      ) AS tmp (price_id, value_in_cents)
      WHERE ${pricesSchema}.${sql.raw(pricesSchema.id.name)} = tmp.price_id
    `;

    await tx.execute(updateSql);
  },

  createOrUpdate: async ({
    tx,
    addonId,
    prices,
    logger,
  }: {
    tx: TRANSACTION_HANDLER;
    addonId: string;
    prices: InferPothosInputType<typeof builder, typeof PricingInputFieldRef>[];
    logger: Logger;
  }): Promise<void> => {
    const existingPrices = await tx
      .select({
        priceId: pricesSchema.id,
        currencyId: pricesSchema.currencyId,
      })
      .from(addonsPricesSchema)
      .innerJoin(pricesSchema, eq(addonsPricesSchema.priceId, pricesSchema.id))
      .where(
        inArray(
          pricesSchema.currencyId,
          prices.map((p) => p.currencyId),
        ),
      );

    const nonExistingPrices = prices.filter(
      (p) => !existingPrices.some((ep) => ep.currencyId === p.currencyId),
    );

    if (existingPrices.length > 0) {
      const pricesToUpdate = existingPrices.map((ep) => {
        const valueInCents = prices.find(
          (p) => p.currencyId === ep.currencyId,
        )?.value_in_cents;

        if (!valueInCents) {
          throw applicationError(
            "Price not found",
            ServiceErrors.INTERNAL_SERVER_ERROR,
            logger,
          );
        }

        return { priceId: ep.priceId, value_in_cents: valueInCents };
      });

      await priceHelpers._update({
        tx,
        prices: pricesToUpdate,
        logger,
      });
    }

    if (nonExistingPrices.length > 0) {
      await priceHelpers._create({
        tx,
        addonId,
        prices: nonExistingPrices,
        logger,
      });
    }
  },

  delete: async ({
    tx,
    addonId,
    priceIds,
  }: {
    tx: TRANSACTION_HANDLER;
    addonId: string;
    priceIds: string[];
  }): Promise<void> => {
    const deletedPrices = await tx
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
        deletedPrices.map((price) => price.id),
      ),
    );
  },
};

const ticketHelpers = {
  validateAssociation: async ({
    tx,
    ticketIds,
    eventId,
    logger,
  }: {
    tx: TRANSACTION_HANDLER;
    ticketIds: string[];
    eventId: string;
    logger: Logger;
  }): Promise<void> => {
    const tickets = await tx.query.ticketsSchema.findMany({
      where: (etc, ops) => {
        return ops.and(
          inArray(ticketsSchema.id, ticketIds),
          eq(ticketsSchema.eventId, eventId),
        );
      },
      columns: { id: true },
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
  },

  associate: async ({
    tx,
    addonId,
    tickets,
  }: {
    tx: TRANSACTION_HANDLER;
    addonId: string;
    tickets: { ticketId: string; orderDisplay: number }[];
  }): Promise<void> => {
    const insertTicketAddons: InsertTicketAddonSchema[] = tickets.map(
      (ticket) => ({
        addonId,
        ticketId: ticket.ticketId,
        orderDisplay: ticket.orderDisplay,
      }),
    );

    await tx.insert(ticketAddonsSchema).values(insertTicketAddons);
  },

  update: async ({
    tx,
    addonId,
    tickets,
  }: {
    tx: TRANSACTION_HANDLER;
    addonId: string;
    tickets: { ticketId: string; orderDisplay: number }[];
  }): Promise<void> => {
    const updateSql = sql`
      UPDATE ${ticketAddonsSchema}
      SET ${sql.raw(
        ticketAddonsSchema.orderDisplay.name,
      )} = tmp.order_display::int
      FROM (
        VALUES
          ${sql.join(
            tickets.map(
              (t) => sql`(${t.ticketId}::uuid, ${t.orderDisplay}::int)`,
            ),
            sql.raw(","),
          )}
      ) AS tmp (ticket_id, order_display)
      WHERE ${ticketAddonsSchema}.${sql.raw(
        ticketAddonsSchema.addonId.name,
      )} = ${addonId}::uuid
        AND ${ticketAddonsSchema}.${sql.raw(
          ticketAddonsSchema.ticketId.name,
        )} = tmp.ticket_id
    `;

    await tx.execute(updateSql);
  },

  delete: async ({
    tx,
    addonId,
    ticketIds,
  }: {
    tx: TRANSACTION_HANDLER;
    addonId: string;
    ticketIds: string[];
  }): Promise<void> => {
    await tx
      .delete(ticketAddonsSchema)
      .where(
        and(
          eq(ticketAddonsSchema.addonId, addonId),
          inArray(ticketAddonsSchema.ticketId, ticketIds),
        ),
      );
  },
};

const constraintHelpers = {
  create: async ({
    tx,
    addonId,
    constraints,
  }: {
    tx: TRANSACTION_HANDLER;
    addonId: string;
    constraints: InferPothosInputType<
      typeof builder,
      typeof CreateAddonConstraintInputRef
    >[];
  }): Promise<void> => {
    await tx.insert(addonConstraintsSchema).values(
      constraints.map((constraint) => ({
        addonId,
        relatedAddonId: constraint.relatedAddonId,
        constraintType: constraint.constraintType,
      })),
    );
  },

  update: async ({
    tx,
    addonId,
    constraints,
  }: {
    tx: TRANSACTION_HANDLER;
    addonId: string;
    constraints: InferPothosInputType<
      typeof builder,
      typeof UpdateAddonConstraintInputRef
    >[];
  }): Promise<void> => {
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
            sql.raw(","),
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
  },

  delete: async ({
    tx,
    addonId,
    constraintIds,
  }: {
    tx: TRANSACTION_HANDLER;
    addonId: string;
    constraintIds: string[];
  }): Promise<void> => {
    await tx
      .delete(addonConstraintsSchema)
      .where(
        and(
          eq(addonConstraintsSchema.addonId, addonId),
          inArray(addonConstraintsSchema.id, constraintIds),
        ),
      );
  },
};

// Main exported helpers
export const createUpdateAddonMutationHelpers = {
  validateBaseData: ({
    logger,
    data,
  }: {
    logger: Logger;
    data: {
      isFree: boolean | undefined | null;
      maxPerTicket: number | undefined | null;
      totalStock: number | undefined | null;
      prices: { currencyId: string | undefined | null }[] | undefined | null;
      isUnlimited: boolean | undefined | null;
    };
  }) => {
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

  handlePricesUpdate: async ({
    logger,
    tx,
    addonId,
    params,
  }: {
    logger: Logger;
    tx: TRANSACTION_HANDLER;
    addonId: string;
    params: {
      prices:
        | InferPothosInputType<typeof builder, typeof PricingInputFieldRef>[]
        | null;
      deletePriceIds: string[] | null;
    };
  }): Promise<void> => {
    const { prices, deletePriceIds } = params;

    if (deletePriceIds?.length) {
      await priceHelpers.delete({ tx, addonId, priceIds: deletePriceIds });
    }

    if (prices?.length) {
      await priceHelpers.createOrUpdate({
        tx,
        addonId,
        prices: prices,
        logger,
      });
    }
  },

  handleTicketsUpdate: async ({
    logger,
    tx,
    params,
  }: {
    logger: Logger;
    tx: TRANSACTION_HANDLER;
    params: {
      addonId: string;
      eventId: string;
      newTickets:
        | InferPothosInputType<typeof builder, typeof AddonInputTicketRef>[]
        | null;
      updateTickets:
        | InferPothosInputType<typeof builder, typeof AddonInputTicketRef>[]
        | null;
      deleteTicketIds: string[] | null;
    };
  }): Promise<void> => {
    const { addonId, eventId, newTickets, updateTickets, deleteTicketIds } =
      params;

    if (deleteTicketIds?.length) {
      await ticketHelpers.delete({ tx, addonId, ticketIds: deleteTicketIds });
    }

    if (updateTickets?.length) {
      await ticketHelpers.update({ tx, addonId, tickets: updateTickets });
    }

    if (newTickets?.length) {
      await ticketHelpers.validateAssociation({
        tx,
        ticketIds: newTickets.map((t) => t.ticketId),
        eventId,
        logger,
      });

      await ticketHelpers.associate({ tx, addonId, tickets: newTickets });
    }
  },

  handleConstraintsUpdate: async ({
    logger,
    tx,
    params,
  }: {
    logger: Logger;
    tx: TRANSACTION_HANDLER;
    params: {
      addonId: string;
      newConstraints:
        | InferPothosInputType<
            typeof builder,
            typeof CreateAddonConstraintInputRef
          >[]
        | null;
      updateConstraints:
        | InferPothosInputType<
            typeof builder,
            typeof UpdateAddonConstraintInputRef
          >[]
        | null;
      deleteConstraintIds: string[] | null;
    };
  }): Promise<void> => {
    const { addonId, newConstraints, updateConstraints, deleteConstraintIds } =
      params;

    if (deleteConstraintIds?.length) {
      await constraintHelpers.delete({
        tx,
        addonId,
        constraintIds: deleteConstraintIds,
      });
    }

    if (updateConstraints?.length) {
      await validateAddonConstraints({
        logger,
        tx,
        addonId,
        newConstraints: updateConstraints,
      });

      await constraintHelpers.update({
        tx,
        addonId,
        constraints: updateConstraints,
      });
    }

    if (newConstraints?.length) {
      await validateAddonConstraints({
        logger,
        tx,
        addonId,
        newConstraints,
      });

      await constraintHelpers.create({
        tx,
        addonId,
        constraints: newConstraints,
      });
    }
  },
};
