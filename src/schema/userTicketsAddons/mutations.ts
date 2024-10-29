import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  InsertUserTicketAddonClaimSchema,
  userTicketAddonsSchema,
  purchaseOrdersSchema,
  insertPurchaseOrdersSchema,
  selectPurchaseOrdersSchema,
  UserTicketAddonApprovalStatus,
} from "~/datasources/db/schema";
import { applicationError, ServiceErrors } from "~/errors";
import { handlePaymentLinkGeneration } from "~/schema/purchaseOrder/actions";

import { validateAddonClaimsAndConstraints } from "./helpers";
import { AddonClaimInputRef } from "../shared/refs";
import {
  RedeemUserTicketErrorType,
  RedeemUserTicketResponse,
} from "../userTickets/mutations/claimUserTicket/refs";

builder.mutationField("claimUserTicketAddons", (t) =>
  t.field({
    description: "Claim ticket addons",
    type: RedeemUserTicketResponse,
    args: {
      userTicketId: t.arg({
        type: "String",
        required: true,
      }),
      addonsClaims: t.arg({
        type: [AddonClaimInputRef],
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
    resolve: async (
      root,
      { userTicketId, addonsClaims, currencyId },
      context,
    ) => {
      const { USER, DB, logger } = context;

      if (!USER) {
        throw new GraphQLError("User not found");
      }

      if (addonsClaims.length === 0) {
        throw applicationError(
          "No addons claims provided",
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      return await DB.transaction(async (trx) => {
        try {
          // Create a new purchase order
          const [createdPurchaseOrder] = await trx
            .insert(purchaseOrdersSchema)
            .values(insertPurchaseOrdersSchema.parse({ userId: USER.id }))
            .returning();

          const userTicketPromise = trx.query.userTicketsSchema.findFirst({
            where: (t, ops) =>
              ops.and(eq(t.id, userTicketId), eq(t.userId, USER.id)),
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

          const uniqueClaimedAddonsPromise = trx.query.userTicketAddonsSchema
            .findMany({
              where: (t, ops) => {
                return ops.and(
                  ops.eq(t.userTicketId, userTicketId),
                  ops.eq(
                    t.approvalStatus,
                    UserTicketAddonApprovalStatus.APPROVED,
                  ),
                );
              },
            })
            .then((claimedAddons) => {
              const uniqueClaimedAddons = claimedAddons.reduce(
                (acc, curr) => {
                  if (!acc[curr.addonId]) {
                    acc[curr.addonId] = {
                      addonId: curr.addonId,
                      quantity: 0,
                    };
                  }

                  acc[curr.addonId].quantity += curr.quantity;

                  return acc;
                },
                {} as Record<
                  string,
                  {
                    addonId: string;
                    quantity: number;
                  }
                >,
              );

              return Object.values(uniqueClaimedAddons);
            });

          const [userTicket, uniqueClaimedAddons] = await Promise.all([
            userTicketPromise,
            uniqueClaimedAddonsPromise,
          ]);

          if (!userTicket) {
            throw applicationError(
              "User ticket not found",
              ServiceErrors.NOT_FOUND,
              logger,
            );
          }

          if (userTicket.approvalStatus !== "approved") {
            throw applicationError(
              "User ticket is not approved",
              ServiceErrors.INVALID_ARGUMENT,
              logger,
            );
          }

          const duplicatedIds = addonsClaims.filter(
            (a, i) =>
              addonsClaims.findIndex((b) => b.addonId === a.addonId) !== i,
          );

          if (duplicatedIds.length > 0) {
            throw applicationError(
              `Duplicated addon ids: ${duplicatedIds.join(", ")}`,
              ServiceErrors.INVALID_ARGUMENT,
              logger,
            );
          }

          const addons = await trx.query.ticketAddonsSchema
            .findMany({
              where: (t, ops) =>
                ops.and(
                  eq(t.ticketId, userTicket.ticketTemplate.id),
                  ops.inArray(
                    t.addonId,
                    addonsClaims.map((a) => a.addonId),
                  ),
                ),
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
                return relations.map(({ addon }) => {
                  const addonPrice = addon.prices.find(
                    (p) => p.price.currency.id === currencyId,
                  );

                  return {
                    ...addon,
                    price: addonPrice?.price || null,
                  };
                });
              }

              return relations.map(({ addon }) => ({
                ...addon,
                price: null,
              }));
            });

          const notFoundAddons = addonsClaims.filter(
            (a) => !addons.find((addon) => addon.id === a.addonId),
          );

          if (notFoundAddons.length > 0) {
            throw applicationError(
              `Some addons were not found: ${notFoundAddons
                .map((a) => a.addonId)
                .join(", ")}`,
              ServiceErrors.NOT_FOUND,
              logger,
            );
          }

          validateAddonClaimsAndConstraints({
            ticketId: userTicket.ticketTemplate.id,
            newAddonClaims: addonsClaims,
            alreadyClaimedAddons: uniqueClaimedAddons,
            ticketRelatedAddonsInfo: addons,
            logger,
          });

          const aggregatedAddonsClaims = addonsClaims.reduce(
            (acc, curr) => {
              const addon = addons.find((a) => a.id === curr.addonId);

              if (!addon) {
                throw applicationError(
                  `Addon not found: ${curr.addonId}`,
                  ServiceErrors.NOT_FOUND,
                  logger,
                );
              }

              acc[addon.id] = {
                quantity: curr.quantity,
                addon,
              };

              return acc;
            },
            {} as Record<
              string,
              {
                quantity: number;
                addon: (typeof addons)[number];
              }
            >,
          );

          let totalPriceInCents = 0;
          const toInsert: InsertUserTicketAddonClaimSchema[] = [];

          for (const [addonId, { quantity, addon }] of Object.entries(
            aggregatedAddonsClaims,
          )) {
            const unitPriceInCents = 0;
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
                  `No price found for addon ${addonId} in the specified currency`,
                  ServiceErrors.NOT_FOUND,
                  logger,
                );
              }

              if (addon.price.price_in_cents === 0) {
                throw applicationError(
                  `Addon ${addonId} is not free, but the price is 0`,
                  ServiceErrors.INVALID_ARGUMENT,
                  logger,
                );
              }
            } else {
              approvalStatus = UserTicketAddonApprovalStatus.APPROVED;
            }

            totalPriceInCents += unitPriceInCents * quantity;

            toInsert.push({
              userTicketId,
              addonId: addon.id,
              purchaseOrderId: createdPurchaseOrder.id,
              quantity,
              unitPriceInCents,
              approvalStatus,
            });
          }

          if (!createdPurchaseOrder) {
            throw applicationError(
              "Failed to create purchase order",
              ServiceErrors.INTERNAL_SERVER_ERROR,
              logger,
            );
          }

          // Insert user ticket addons
          await trx.insert(userTicketAddonsSchema).values(toInsert).returning();

          if (totalPriceInCents > 0 && currencyId) {
            const community =
              userTicket.ticketTemplate.event.eventsToCommunities[0].community;
            const defaultRedirectUrl = context.PURCHASE_CALLBACK_URL;
            const paymentSuccessRedirectURL =
              community.paymentSuccessRedirectURL ?? defaultRedirectUrl;
            const paymentCancelRedirectURL =
              community.paymentCancelRedirectURL ?? defaultRedirectUrl;

            return handlePaymentLinkGeneration({
              DB: trx,
              logger,
              GET_MERCADOPAGO_CLIENT: context.GET_MERCADOPAGO_CLIENT,
              GET_STRIPE_CLIENT: context.GET_STRIPE_CLIENT,
              paymentSuccessRedirectURL,
              paymentCancelRedirectURL,
              currencyId,
              purchaseOrderId: createdPurchaseOrder.id,
              USER: USER,
            });
          }

          return {
            purchaseOrder:
              selectPurchaseOrdersSchema.parse(createdPurchaseOrder),
            ticketsIds: [userTicket.id],
          };
        } catch (e: unknown) {
          logger.error("Error claiming user ticket addons", e);

          return handleClaimError(e);
        }
      });
    },
  }),
);

function handleClaimError(error: unknown): RedeemUserTicketErrorType {
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
