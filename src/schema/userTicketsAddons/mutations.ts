import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  userTicketAddonsSchema,
  selectPurchaseOrdersSchema,
} from "~/datasources/db/schema";
import { applicationError, ServiceErrors } from "~/errors";
import { handlePaymentLinkGeneration } from "~/schema/purchaseOrder/actions";
import {
  createInitialPurchaseOrder,
  getPurchaseRedirectURLsFromPurchaseOrder,
} from "~/schema/purchaseOrder/helpers";
import { InferPothosOutputType } from "~/types";

import {
  validateAddonClaimsAndConstraints,
  claimUserTicketAddonsHelpers,
} from "./helpers";
import { PurchaseOrderRef } from "../purchaseOrder/types";

const ClaimUserTicketAddonInput = builder
  .inputRef<{
    userTicketId: string;
    addonId: string;
    quantity: number;
  }>("ClaimUserTicketAddonInput")
  .implement({
    fields: (t) => ({
      userTicketId: t.string({
        required: true,
        description: "The ID of the user ticket to add the addon to",
      }),
      addonId: t.string({
        required: true,
        description: "The ID of the addon to claim",
      }),
      quantity: t.int({
        required: true,
        description: "The quantity of the addon to claim",
      }),
    }),
  });

const RedeemUserTicketAddonsErrorRef = builder.objectRef<{
  error: true;
  errorMessage: string;
}>("RedeemUserTicketAddonsError");

const RedeemUserTicketAddonsError = builder.objectType(
  RedeemUserTicketAddonsErrorRef,
  {
    fields: (t) => ({
      error: t.field({
        type: "Boolean",
        resolve: () => true,
      }),
      errorMessage: t.exposeString("errorMessage", {}),
    }),
  },
);

export type RedeemUserTicketAddonsErrorType = InferPothosOutputType<
  typeof builder,
  typeof RedeemUserTicketAddonsErrorRef
>;

export const RedeemUserTicketAddonsResponse = builder.unionType(
  "RedeemUserTicketAddonsResponse",
  {
    types: [PurchaseOrderRef, RedeemUserTicketAddonsError],
    resolveType: (value) =>
      "errorMessage" in value ? RedeemUserTicketAddonsError : PurchaseOrderRef,
  },
);

builder.mutationField("claimUserTicketAddons", (t) =>
  t.field({
    description: "Claim addons for multiple user tickets",
    type: RedeemUserTicketAddonsResponse,
    args: {
      addonsClaims: t.arg({
        type: [ClaimUserTicketAddonInput],
        required: true,
      }),
      currencyId: t.arg({
        type: "String",
        required: false,
        description:
          "The currency id to use for the purchase order. If any addon is not free, this parameter is required",
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { addonsClaims, currencyId }, context) => {
      const { USER, DB, logger } = context;

      if (!USER) {
        throw new GraphQLError("User not found");
      }

      return await DB.transaction(async (trx) => {
        try {
          // Group claims by ticket and validate basic input structure
          const { uniqueUserTicketIds, claimsByTicket } =
            claimUserTicketAddonsHelpers.validateAndGroupClaims({
              addonsClaims,
              logger,
            });

          const [
            createdPurchaseOrder,
            userTickets,
            aggregatedAddons,
            claimedAddonsByUserTicketId,
          ] = await Promise.all([
            createInitialPurchaseOrder({
              DB: trx,
              userId: USER.id,
              logger,
            }),
            claimUserTicketAddonsHelpers.fetchAndValidateUserTickets({
              trx,
              userTicketIds: uniqueUserTicketIds,
              userId: USER.id,
              logger,
            }),
            claimUserTicketAddonsHelpers.fetchAndValidateAggregatedAddons({
              trx,
              currencyId,
              logger,
              addonIds: addonsClaims.map((a) => a.addonId),
            }),
            claimUserTicketAddonsHelpers.fetchClaimedAddonsByUserTicketId({
              trx,
              userTicketIds: uniqueUserTicketIds,
            }),
          ]);

          // validate that all addons constraints are respected
          for (const [userTicketId, claims] of Object.entries(claimsByTicket)) {
            const userTicket = userTickets.find((ut) => ut.id === userTicketId);
            const validAddons = aggregatedAddons.filter(
              (ta) => ta.ticketId === userTicket?.ticketTemplate.id,
            );

            if (!userTicket) {
              throw applicationError(
                "User ticket not found",
                ServiceErrors.NOT_FOUND,
                logger,
              );
            }

            validateAddonClaimsAndConstraints({
              ticketId: userTicket.ticketTemplate.id,
              newAddonClaims: claims,
              alreadyClaimedAddons:
                claimedAddonsByUserTicketId[userTicketId] ?? [],
              ticketRelatedAddonsInfo: validAddons,
              logger,
            });
          }

          const { toInsert, totalPriceInCents } =
            claimUserTicketAddonsHelpers.prepareAddonClaims({
              addonsClaims,
              addonsWithRelatedTicketId: aggregatedAddons,
              currencyId,
              purchaseOrderId: createdPurchaseOrder.id,
              logger,
            });

          // Insert user ticket addons
          await trx.insert(userTicketAddonsSchema).values(toInsert);

          if (totalPriceInCents > 0) {
            if (!currencyId) {
              throw applicationError(
                "Currency id is required for paid addons",
                ServiceErrors.INVALID_ARGUMENT,
                logger,
              );
            }

            const uniqueEventsIds = new Set(
              userTickets.map((ut) => ut.ticketTemplate.event.id),
            );

            if (uniqueEventsIds.size > 1) {
              throw applicationError(
                "Multiple events found for related user tickets. This is not allowed for the time being (We are working on it)",
                ServiceErrors.FAILED_PRECONDITION,
                logger,
              );
            }

            const redirectURLs = await getPurchaseRedirectURLsFromPurchaseOrder(
              {
                DB: trx,
                purchaseOrderId: createdPurchaseOrder.id,
                default_redirect_url: context.PURCHASE_CALLBACK_URL,
              },
            );

            return handlePaymentLinkGeneration({
              DB: trx,
              logger,
              GET_MERCADOPAGO_CLIENT: context.GET_MERCADOPAGO_CLIENT,
              GET_STRIPE_CLIENT: context.GET_STRIPE_CLIENT,
              paymentSuccessRedirectURL: redirectURLs.paymentSuccessRedirectURL,
              paymentCancelRedirectURL: redirectURLs.paymentCancelRedirectURL,
              currencyId,
              purchaseOrderId: createdPurchaseOrder.id,
              USER: USER,
            });
          }

          return {
            purchaseOrder:
              selectPurchaseOrdersSchema.parse(createdPurchaseOrder),
            ticketsIds: uniqueUserTicketIds,
          };
        } catch (e: unknown) {
          logger.error("Error claiming user ticket addons", e);

          return handleClaimError(e);
        }
      });
    },
  }),
);

function handleClaimError(error: unknown): RedeemUserTicketAddonsErrorType {
  if (error instanceof GraphQLError || error instanceof Error) {
    return {
      error: true,
      errorMessage: error.message,
    };
  }

  return {
    error: true,
    errorMessage: "An unknown error occurred",
  };
}
