import { TRANSACTION_HANDLER } from "~/datasources/db";
import {
  InsertUserTicketAddonClaimSchema,
  SelectAddonConstraintSchema,
  SelectAddonPriceSchema,
  SelectAddonSchema,
  UserTicketAddonApprovalStatus,
} from "~/datasources/db/schema";
import { AddonConstraintType } from "~/datasources/db/ticketAddons";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";

import { REDEEMABLE_USER_TICKET_APPROVAL_STATUSES } from "../userTickets/constants";

type ValidateAddonClaimsAndConstraints = {
  ticketId: string;
  newAddonClaims: { addonId: string; quantity: number }[];
  alreadyClaimedAddons: { addonId: string; quantity: number }[];
  ticketRelatedAddonsInfo: {
    id: string;
    maxPerTicket: number | null;
    constraints: {
      constraintType: AddonConstraintType;
      relatedAddonId: string;
    }[];
  }[];
  logger: Logger;
};

export function validateAddonClaimsAndConstraints({
  ticketId,
  newAddonClaims,
  alreadyClaimedAddons,
  ticketRelatedAddonsInfo,
  logger,
}: ValidateAddonClaimsAndConstraints) {
  const allAddonClaims = [...alreadyClaimedAddons, ...newAddonClaims];

  for (const addonClaim of allAddonClaims) {
    const addon = ticketRelatedAddonsInfo.find(
      (a) => a.id === addonClaim.addonId,
    );

    if (!addon) {
      throw applicationError(
        `Addon ${addonClaim.addonId} is not related to ticket ${ticketId}`,
        ServiceErrors.NOT_FOUND,
        logger,
      );
    }

    if (addonClaim.quantity <= 0) {
      throw applicationError(
        `Invalid quantity for addon ${addonClaim.addonId}`,
        ServiceErrors.FAILED_PRECONDITION,
        logger,
      );
    }

    if (addon.maxPerTicket) {
      const totalQuantity = allAddonClaims
        .filter((r) => r.addonId === addon.id)
        .reduce((sum, r) => sum + r.quantity, 0);

      if (totalQuantity > addon.maxPerTicket) {
        throw applicationError(
          `Addon ${addon.id} total quantity exceeds limit per ticket for ticket ${ticketId}`,
          ServiceErrors.FAILED_PRECONDITION,
          logger,
        );
      }
    }

    for (const constraint of addon.constraints) {
      const relatedAddonClaim = allAddonClaims.find(
        (r) => r.addonId === constraint.relatedAddonId,
      );

      if (
        constraint.constraintType === AddonConstraintType.DEPENDENCY &&
        !relatedAddonClaim
      ) {
        throw applicationError(
          `Addon ${addon.id} requires addon ${constraint.relatedAddonId}`,
          ServiceErrors.FAILED_PRECONDITION,
          logger,
        );
      }

      if (
        constraint.constraintType === AddonConstraintType.MUTUAL_EXCLUSION &&
        relatedAddonClaim
      ) {
        throw applicationError(
          `Addon ${addon.id} is mutually exclusive with addon ${constraint.relatedAddonId}`,
          ServiceErrors.FAILED_PRECONDITION,
          logger,
        );
      }
    }
  }
}

type AddonWithPrice = SelectAddonSchema & {
  ticketId: string;
  price: { price_in_cents: number } | null;
  constraints: SelectAddonConstraintSchema[];
  prices: SelectAddonPriceSchema[];
};

export const claimUserTicketAddonsHelpers = {
  /**
   * Groups addon claims by ticket and ensures basic input validation.
   */
  validateAndGroupClaims: ({
    addonsClaims,
    logger,
  }: {
    addonsClaims: { userTicketId: string; addonId: string; quantity: number }[];
    logger: Logger;
  }) => {
    if (addonsClaims.length === 0) {
      throw applicationError(
        "No addons claims provided",
        ServiceErrors.INVALID_ARGUMENT,
        logger,
      );
    }

    const uniqueUserTicketIds: string[] = [];
    const claimsByTicket = addonsClaims.reduce(
      (acc, claim) => {
        if (!acc[claim.userTicketId]) {
          acc[claim.userTicketId] = [];

          uniqueUserTicketIds.push(claim.userTicketId);
        }

        acc[claim.userTicketId].push({
          addonId: claim.addonId,
          quantity: claim.quantity,
        });

        return acc;
      },
      {} as Record<string, { addonId: string; quantity: number }[]>,
    );

    return { uniqueUserTicketIds, claimsByTicket };
  },

  /**
   * Fetches user tickets and validates:
   * - Ticket ownership, only the current user's tickets are fetched
   * - Ticket approval status
   * - Related event and community data
   */
  fetchAndValidateUserTickets: async ({
    trx,
    userTicketIds,
    userId,
    logger,
  }: {
    trx: TRANSACTION_HANDLER;
    userTicketIds: string[];
    userId: string;
    logger: Logger;
  }) => {
    const userTickets = await trx.query.userTicketsSchema.findMany({
      where: (t, ops) =>
        ops.and(ops.inArray(t.id, userTicketIds), ops.eq(t.userId, userId)),
      with: {
        ticketTemplate: {
          with: {
            event: {
              with: {
                eventsToCommunities: {
                  with: {
                    community: true,
                  },
                },
              },
            },
            ticketsPrices: {
              with: {
                price: {
                  with: {
                    currency: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    userTickets.forEach((userTicket) => {
      if (
        !REDEEMABLE_USER_TICKET_APPROVAL_STATUSES.includes(
          userTicket.approvalStatus,
        )
      ) {
        throw applicationError(
          `Can't claim addons for user ticket: ${userTicket.id} because it's not in a valid approval status`,
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }
    });

    const notFoundUserTickets = userTicketIds.filter(
      (id) => !userTickets.find((ut) => ut.id === id),
    );

    if (notFoundUserTickets.length > 0) {
      throw applicationError(
        `Some user tickets were not found: ${notFoundUserTickets.join(", ")}`,
        ServiceErrors.NOT_FOUND,
        logger,
      );
    }

    return userTickets;
  },

  /**
   * Fetches and validates addons with their pricing information.
   * Ensures all requested addons exist.
   * If currencyId is provided, includes pricing information for that currency.
   */
  fetchAndValidateAggregatedAddons: async ({
    trx,
    addonIds,
    currencyId,
    logger,
  }: {
    trx: TRANSACTION_HANDLER;
    addonIds: string[];
    currencyId?: string | null;
    logger: Logger;
  }): Promise<AddonWithPrice[]> => {
    const addonsWithPrice = await trx.query.ticketAddonsSchema
      .findMany({
        where: (t, ops) => ops.inArray(t.addonId, addonIds),
        with: {
          addon: {
            with: {
              constraints: true,
              prices: {
                with: {
                  price: {
                    with: {
                      currency: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      .then((relations) => {
        if (currencyId) {
          return relations.map(({ addon, ticketId }) => {
            const price =
              addon.prices.find((p) => p.price.currency.id === currencyId)
                ?.price || null;

            return { ...addon, ticketId, price };
          });
        }

        return relations.map(({ addon, ticketId }) => ({
          ...addon,
          ticketId,
          price: null,
        }));
      });

    const notFoundAddons = addonIds.filter(
      (id) => !addonsWithPrice.find((addon) => addon.id === id),
    );

    if (notFoundAddons.length > 0) {
      throw applicationError(
        `Some addons were not found: ${notFoundAddons.join(", ")}`,
        ServiceErrors.NOT_FOUND,
        logger,
      );
    }

    return addonsWithPrice;
  },

  /**
   * Fetches and aggregates the quantity of approved addon claims for given user tickets.
   * Returns a nested object structure mapping user ticket IDs to their claimed addons and quantities.
   * Only includes addons with APPROVED status.
   *
   * @example
   * // Returns an object like:
   * {
   *   "user-ticket-1": [
   *     { addonId: "addon-123", quantity: 2 },
   *     { addonId: "addon-456", quantity: 1 }
   *   ],
   *   "user-ticket-2": [
   *     { addonId: "addon-789", quantity: 3 }
   *   ]
   * }
   */
  fetchClaimedAddonsByUserTicketId: async ({
    trx,
    userTicketIds,
  }: {
    trx: TRANSACTION_HANDLER;
    userTicketIds: string[];
  }) => {
    const claimedAddonsByUserTicketId = await trx.query.userTicketAddonsSchema
      .findMany({
        where: (t, ops) => {
          return ops.and(
            ops.inArray(t.userTicketId, userTicketIds),
            ops.eq(t.approvalStatus, UserTicketAddonApprovalStatus.APPROVED),
          );
        },
      })
      .then((userTicketAddons) => {
        const claimedAddonsByUserTicketId = userTicketAddons.reduce(
          (acc, curr) => {
            if (!acc[curr.userTicketId]) {
              acc[curr.userTicketId] = {};
            }

            if (!acc[curr.userTicketId][curr.addonId]) {
              acc[curr.userTicketId][curr.addonId] = 0;
            }

            acc[curr.userTicketId][curr.addonId] += curr.quantity;

            return acc;
          },
          {} as Record<string, Record<string, number>>,
        );

        const result: Record<string, { addonId: string; quantity: number }[]> =
          {};

        // For each ticket and its addons
        for (const [ticketId, addons] of Object.entries(
          claimedAddonsByUserTicketId,
        )) {
          // Convert the addon quantities into an array of objects
          result[ticketId] = Object.entries(addons).map(
            ([addonId, quantity]) => ({
              addonId,
              quantity,
            }),
          );
        }

        return result;
      });

    return claimedAddonsByUserTicketId;
  },

  /**
   * Prepares addon claims for database insertion and calculates total price.
   * Handles both free and paid addons:
   * - Free addons are automatically approved
   * - Paid addons require currency and valid pricing
   * - Validates price consistency for paid addons
   */
  prepareAddonClaims: ({
    addonsClaims,
    addonsWithRelatedTicketId,
    currencyId,
    purchaseOrderId,
    logger,
  }: {
    addonsClaims: { userTicketId: string; addonId: string; quantity: number }[];
    addonsWithRelatedTicketId: AddonWithPrice[];
    currencyId?: string | null;
    purchaseOrderId: string;
    logger: Logger;
  }): {
    toInsert: InsertUserTicketAddonClaimSchema[];
    totalPriceInCents: number;
  } => {
    let totalPriceInCents = 0;
    const toInsert: InsertUserTicketAddonClaimSchema[] = [];

    addonsClaims.forEach((claim) => {
      const addon = addonsWithRelatedTicketId.find(
        (a) => a.id === claim.addonId,
      );

      if (!addon) {
        throw applicationError(
          `Addon not found: ${claim.addonId}`,
          ServiceErrors.NOT_FOUND,
          logger,
        );
      }

      const unitPriceInCents = addon.price?.price_in_cents || 0;
      let approvalStatus: UserTicketAddonApprovalStatus =
        UserTicketAddonApprovalStatus.PENDING;

      if (!addon.isFree) {
        if (!currencyId) {
          throw applicationError(
            "Currency ID is required for non-free addons",
            ServiceErrors.INVALID_ARGUMENT,
            logger,
          );
        }

        if (!addon.price) {
          throw applicationError(
            `No price found for addon ${claim.addonId} in the specified currency`,
            ServiceErrors.NOT_FOUND,
            logger,
          );
        }

        if (unitPriceInCents === 0) {
          throw applicationError(
            `Addon ${claim.addonId} is not free, but the price is 0`,
            ServiceErrors.INVALID_ARGUMENT,
            logger,
          );
        }
      } else {
        approvalStatus = UserTicketAddonApprovalStatus.APPROVED;
      }

      totalPriceInCents += unitPriceInCents * claim.quantity;

      toInsert.push({
        userTicketId: claim.userTicketId,
        addonId: addon.id,
        purchaseOrderId,
        quantity: claim.quantity,
        unitPriceInCents,
        approvalStatus,
      });
    });

    return { toInsert, totalPriceInCents };
  },
};
