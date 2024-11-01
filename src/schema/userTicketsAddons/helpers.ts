import { AddonConstraintType } from "~/datasources/db/ticketAddons";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";

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
