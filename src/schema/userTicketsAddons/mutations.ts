import { eq, inArray } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  userTicketAddonsSchema,
  selectPurchaseOrdersSchema,
  purchaseOrdersSchema,
  userTicketsSchema,
  UserTicketAddonApprovalStatus,
  AddonConstraintType,
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
import { UserTicketAddonRef } from "../ticketAddons/types";

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
            { userTickets, aggregatedAddons, claimedAddonsByUserTicketId },
          ] = await Promise.all([
            createInitialPurchaseOrder({
              DB: trx,
              userId: USER.id,
              logger,
            }),
            claimUserTicketAddonsHelpers.fetchAndValidateTicketData({
              trx,
              userTicketIds: uniqueUserTicketIds,
              userId: USER.id,
              logger,
              addonIds: addonsClaims.map((a) => a.addonId),
              currencyId,
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

          const [updatedPurchaseOrder] = await trx
            .update(purchaseOrdersSchema)
            .set({
              purchaseOrderPaymentStatus: "not_required",
              status: "complete",
              totalPrice: "0",
            })
            .where(eq(purchaseOrdersSchema.id, createdPurchaseOrder.id))
            .returning();

          if (!updatedPurchaseOrder) {
            throw applicationError(
              "Failed to update purchase order",
              ServiceErrors.FAILED_PRECONDITION,
              logger,
            );
          }

          return {
            purchaseOrder:
              selectPurchaseOrdersSchema.parse(updatedPurchaseOrder),
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

builder.mutationField("cancelUserTicketAddons", (t) =>
  t.field({
    description: "Cancel addons for multiple user tickets",
    type: [UserTicketAddonRef],
    args: {
      userTicketAddonIds: t.arg({
        type: ["String"],
        required: true,
        description: "The IDs of the user ticket addons to cancel",
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { userTicketAddonIds }, context) => {
      const { USER, DB, logger } = context;

      if (!USER) {
        throw new GraphQLError("User not found");
      }

      if (userTicketAddonIds.length === 0) {
        throw applicationError(
          "No user ticket addons provided",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      return await DB.transaction(async (trx) => {
        try {
          const allUserTickets = await trx.query.userTicketsSchema.findMany({
            where: eq(userTicketsSchema.userId, USER.id),
            columns: {
              id: true,
            },
            with: {
              userTicketAddons: {
                columns: {
                  id: true,
                  addonId: true,
                  approvalStatus: true,
                },
                with: {
                  purchaseOrder: {
                    columns: {
                      id: true,
                      paymentPlatform: true,
                    },
                  },
                  addon: {
                    columns: {
                      id: true,
                    },
                    with: {
                      constraints: {
                        columns: {
                          id: true,
                          constraintType: true,
                          relatedAddonId: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          // Fetch the user ticket addons and validate ownership
          const userTicketAddonsToCancel = allUserTickets
            .flatMap((ut) => ut.userTicketAddons)
            .filter((uta) => userTicketAddonIds.includes(uta.id));

          // Validate that all requested addons exist and belong to the user
          const notFoundUserTicketAddonIds = userTicketAddonIds.filter(
            (id) => !userTicketAddonsToCancel.some((uta) => uta.id === id),
          );

          if (notFoundUserTicketAddonIds.length > 0) {
            throw applicationError(
              `Some user ticket addons were not found or don't belong to the user: ${notFoundUserTicketAddonIds.join(
                ", ",
              )}`,
              ServiceErrors.NOT_FOUND,
              logger,
            );
          }

          // Check for already cancelled addons
          const alreadyCancelledAddons = userTicketAddonsToCancel.filter(
            (uta) =>
              uta.approvalStatus === UserTicketAddonApprovalStatus.CANCELLED,
          );

          if (alreadyCancelledAddons.length > 0) {
            throw applicationError(
              `Some addons are already cancelled: ${alreadyCancelledAddons
                .map((ada) => ada.id)
                .join(", ")}`,
              ServiceErrors.FAILED_PRECONDITION,
              logger,
            );
          }

          // Fetch all user ticket addons for the same tickets to check dependencies
          const otherUserTicketAddons = allUserTickets
            .flatMap((ut) => ut.userTicketAddons)
            .filter((uta) => !userTicketAddonIds.includes(uta.id));

          // TODO: Future improvements needed:
          // 1. Handle paid addons cancellation - requires refund logic implementation
          // 2. Consider implementing a cancellation window/policy
          // 3. Consider support for partial refunds based on time until event
          // 4. Consider option to cascade cancel dependent addons if the user confirms it

          // For now, we only allow addons with no dependencies
          for (const addonToCancel of userTicketAddonsToCancel) {
            const dependentAddons = otherUserTicketAddons.filter((uta) => {
              // Check if any of the user's active addons depend on the addon being cancelled
              return uta.addon.constraints.some(
                (constraint) =>
                  constraint.constraintType ===
                    AddonConstraintType.DEPENDENCY &&
                  constraint.relatedAddonId === addonToCancel.addonId,
              );
            });

            if (dependentAddons.length > 0) {
              throw applicationError(
                `NOT SUPPORTED: Cannot cancel addon ${
                  addonToCancel.addonId
                } because other addons depend on it: ${dependentAddons
                  .map((da) => da.addonId)
                  .join(", ")}`,
                ServiceErrors.CONFLICT,
                logger,
              );
            }
          }

          // For now, we only allow canceling free addons
          for (const addon of userTicketAddonsToCancel) {
            if (addon.purchaseOrder.paymentPlatform !== null) {
              throw applicationError(
                "NOT SUPPORTED: Cancellation of paid addons is not supported yet",
                ServiceErrors.FAILED_PRECONDITION,
                logger,
              );
            }
          }

          // Cancel the addons by updating their status
          const cancelledAddons = await trx
            .update(userTicketAddonsSchema)
            .set({
              approvalStatus: UserTicketAddonApprovalStatus.CANCELLED,
              updatedAt: new Date(),
            })
            .where(inArray(userTicketAddonsSchema.id, userTicketAddonIds))
            .returning();

          return cancelledAddons;
        } catch (e: unknown) {
          logger.error("Error cancelling user ticket addons", e);
          throw e;
        }
      });
    },
  }),
);
