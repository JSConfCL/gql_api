import { and, count, eq, inArray } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import { ORM_TYPE, TRANSACTION_HANDLER } from "~/datasources/db";
import {
  InsertUserTicketSchema,
  UserTicketTransferStatus,
  InsertUserTicketTransferSchema,
  selectPurchaseOrdersSchema,
  userTicketTransfersSchema,
  userTicketsSchema,
  SelectUserTicketSchema,
  UserTicketApprovalStatus,
  AddonConstraintType,
  InsertUserTicketAddonClaimSchema,
  UserTicketAddonRedemptionStatus,
  userTicketAddonsSchema,
} from "~/datasources/db/schema";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";
import { handlePaymentLinkGeneration } from "~/schema/purchaseOrder/actions";
import {
  createInitialPurchaseOrder,
  getPurchaseRedirectURLsFromPurchaseOrder,
} from "~/schema/purchaseOrder/helpers";
import { isValidUUID } from "~/schema/shared/helpers";
import { cleanEmail } from "~/schema/user/userHelpers";
import { getOrCreateTransferRecipients } from "~/schema/userTicketsTransfers/helpers";
import { Context } from "~/types";

import {
  RedeemUserTicketErrorType,
  RedeemUserTicketResponse,
  TicketClaimInput,
  TicketClaimInputType,
} from "./refs";
import { assertCanStartTicketClaimingForEvent } from "../../helpers";

// Types
type TicketClaimContext = NonNullableFields<
  Pick<
    Context,
    | "GET_STRIPE_CLIENT"
    | "GET_MERCADOPAGO_CLIENT"
    | "PURCHASE_CALLBACK_URL"
    | "logger"
    | "USER"
  >
> & {
  DB: TRANSACTION_HANDLER;
};

export type NormalizedTicketClaimOrder = {
  ticketId: string;
  quantity: number;
  itemDetails: Array<{
    transferInfo: {
      email: string;
      name: string;
      message: string | null;
    } | null;
    addonRequests: Array<{
      addonId: string;
      quantity: number;
    }>;
  }>;
};

export type NormalizedTicketClaimInput = Record<
  string,
  NormalizedTicketClaimOrder
>;

export type TicketClaimTicketsInfo = {
  tickets: Array<{
    id: string;
    name: string;
    description: string | null;
    isFree: boolean;
    requiresApproval: boolean;
    quantity: number | null;
    maxTicketsPerUser: number | null;
    tags: string[] | null;
  }>;
  addons: Array<{
    id: string;
    name: string;
    description: string | null;
    totalStock: number | null;
    maxPerTicket: number | null;
    isUnlimited: boolean;
    constraints: Array<{
      constraintType: AddonConstraintType;
      relatedAddonId: string;
    }>;
    ticketAddons: Array<{
      ticketId: string;
    }>;
  }>;
};

type UserTicketClaimData = Array<{
  ticket: InsertUserTicketSchema;
  transferAttempt: Omit<InsertUserTicketTransferSchema, "userTicketId"> | null;
  addonClaims: Array<Omit<InsertUserTicketAddonClaimSchema, "userTicketId">>;
}>;

builder.mutationField("claimUserTicket", (t) =>
  t.field({
    description: "Attempt to claim and/or transfer tickets",
    type: RedeemUserTicketResponse,
    args: {
      input: t.arg({ type: TicketClaimInput, required: true }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (_root, { input }, context) => {
      const { USER, DB, logger } = context;

      if (!USER) {
        throw new GraphQLError("User not found");
      }

      try {
        return await DB.transaction(async (trx) => {
          return await processTicketClaim({
            input,
            context: { ...context, USER, DB: trx },
          });
        });
      } catch (error) {
        logger.error("Error claiming user tickets", error);

        return handleClaimError(error);
      }
    },
  }),
);

// Main processing function
async function processTicketClaim({
  input,
  context,
}: {
  input: TicketClaimInputType;
  context: TicketClaimContext;
}) {
  const { purchaseOrder, generatePaymentLink } = input;
  const { logger, USER, DB } = context;

  const normalizedInput = normalizeTicketClaimInput(purchaseOrder, logger);

  const [ticketsAndAddonsInfo, purchaseOrderRecord, transferRecipients] =
    await Promise.all([
      fetchTicketsAndAddonsInfo(DB, normalizedInput, logger),
      createInitialPurchaseOrder({
        DB,
        userId: USER.id,
        logger,
      }),
      getOrCreateTransferRecipients({
        DB,
        transferRecipients: Object.values(normalizedInput)
          .flatMap((order) => order.itemDetails.map((i) => i.transferInfo))
          .filter(Boolean),
      }),
    ]);

  await assertCanStartTicketClaimingForEvent(
    context,
    ticketsAndAddonsInfo,
    normalizedInput,
  );

  const userTicketsToClaim = prepareUserTicketClaimData({
    ticketsAndAddonsInfo,
    normalizedInput,
    purchaseOrderRecord,
    transferRecipients,
    USER,
    logger,
  });

  const createdUserTickets = await saveUserTicketsAndRelatedData(
    DB,
    userTicketsToClaim,
  );

  await verifyFinalUserTicketCounts(DB, ticketsAndAddonsInfo, USER, logger);

  if (generatePaymentLink) {
    const redirectURLs = await getPurchaseRedirectURLsFromPurchaseOrder({
      DB,
      purchaseOrderId: purchaseOrderRecord.id,
      default_redirect_url: context.PURCHASE_CALLBACK_URL,
    });

    return handlePaymentLinkGeneration({
      DB,
      USER,
      purchaseOrderId: purchaseOrderRecord.id,
      currencyId: generatePaymentLink.currencyId,
      GET_STRIPE_CLIENT: context.GET_STRIPE_CLIENT,
      GET_MERCADOPAGO_CLIENT: context.GET_MERCADOPAGO_CLIENT,
      logger,
      paymentSuccessRedirectURL: redirectURLs.paymentSuccessRedirectURL,
      paymentCancelRedirectURL: redirectURLs.paymentCancelRedirectURL,
    });
  }

  return {
    purchaseOrder: selectPurchaseOrdersSchema.parse(purchaseOrderRecord),
    ticketsIds: createdUserTickets.map((ticket) => ticket.id),
  };
}

// Helper functions
function normalizeTicketClaimInput(
  purchaseOrder: TicketClaimInputType["purchaseOrder"],
  logger: Logger,
): NormalizedTicketClaimInput {
  if (purchaseOrder.length === 0) {
    throw applicationError(
      "Purchase order is empty",
      ServiceErrors.INVALID_ARGUMENT,
      logger,
    );
  }

  const acc: NormalizedTicketClaimInput = {};

  for (const item of purchaseOrder) {
    if (!isValidUUID(item.ticketId)) {
      throw applicationError(
        "Invalid ticket id",
        ServiceErrors.INVALID_ARGUMENT,
        logger,
      );
    }

    if (item.quantity <= 0) {
      throw applicationError(
        "Invalid quantity",
        ServiceErrors.INVALID_ARGUMENT,
        logger,
      );
    }

    if (!acc[item.ticketId]) {
      acc[item.ticketId] = {
        ticketId: item.ticketId,
        quantity: 0,
        itemDetails: [],
      };
    }

    acc[item.ticketId].quantity += item.quantity;

    const details = (item.itemsDetails || [])?.map((data) => {
      const transfer = data.transferInfo;
      let transferInfo = null;

      if (transfer) {
        transferInfo = {
          name: transfer.name,
          email: cleanEmail(transfer.email),
          message: transfer.message || null,
        };
      }

      return { transferInfo, addonRequests: data.addons };
    });

    acc[item.ticketId].itemDetails.push(...details);
  }

  return acc;
}

async function fetchTicketsAndAddonsInfo(
  DB: ORM_TYPE,
  normalizedInput: NormalizedTicketClaimInput,
  logger: Logger,
): Promise<TicketClaimTicketsInfo> {
  const ticketIds = Object.keys(normalizedInput);
  const addonIds = Object.values(normalizedInput)
    .flatMap((order) => order.itemDetails.flatMap((i) => i.addonRequests))
    .map((addon) => addon.addonId);

  const [tickets, addons] = await Promise.all([
    DB.query.ticketsSchema.findMany({
      where: (t, { inArray }) => inArray(t.id, ticketIds),
      columns: {
        id: true,
        name: true,
        description: true,
        isFree: true,
        requiresApproval: true,
        quantity: true,
        maxTicketsPerUser: true,
        tags: true,
      },
      with: {
        ticketAddons: {
          columns: {
            addonId: true,
          },
        },
      },
    }),
    addonIds.length > 0
      ? DB.query.addonsSchema.findMany({
          where: (a, { inArray }) => inArray(a.id, addonIds),
          columns: {
            id: true,
            name: true,
            description: true,
            totalStock: true,
            maxPerTicket: true,
            isUnlimited: true,
          },
          with: {
            constraints: {
              columns: {
                constraintType: true,
                relatedAddonId: true,
              },
            },
            ticketAddons: {
              columns: {
                ticketId: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const notFoundTicketIds = ticketIds.filter(
    (id) => !tickets.find((t) => t.id === id),
  );

  if (notFoundTicketIds.length > 0) {
    throw applicationError(
      `Tickets with ids ${notFoundTicketIds.join(", ")} not found`,
      ServiceErrors.NOT_FOUND,
      logger,
    );
  }

  return { tickets, addons };
}

function prepareUserTicketClaimData({
  ticketsAndAddonsInfo,
  normalizedInput,
  purchaseOrderRecord,
  transferRecipients,
  USER,
  logger,
}: {
  ticketsAndAddonsInfo: TicketClaimTicketsInfo;
  normalizedInput: NormalizedTicketClaimInput;
  purchaseOrderRecord: { id: string };
  transferRecipients: Map<string, { id: string }>;
  USER: NonNullable<Context["USER"]>;
  logger: Logger;
}): UserTicketClaimData {
  const { tickets: ticketTemplates } = ticketsAndAddonsInfo;

  return ticketTemplates.flatMap((ticketTemplate) => {
    const order = normalizedInput[ticketTemplate.id];
    const isApproved =
      ticketTemplate.isFree && !ticketTemplate.requiresApproval;

    const newTickets: UserTicketClaimData = [];

    for (let i = 0; i < order.quantity; i++) {
      const itemDetails =
        order.itemDetails.length > i ? order.itemDetails[i] : null;

      const newTicket: InsertUserTicketSchema = {
        userId: USER.id,
        purchaseOrderId: purchaseOrderRecord.id,
        ticketTemplateId: ticketTemplate.id,
        approvalStatus: isApproved ? "approved" : "pending",
      };

      let transferAttempt = null;

      if (itemDetails?.transferInfo) {
        const transferInfo = itemDetails.transferInfo;
        const recipientUser = transferRecipients.get(transferInfo.email);

        if (!recipientUser) {
          throw applicationError(
            `Recipient user not found for email ${transferInfo.email}`,
            ServiceErrors.NOT_FOUND,
            logger,
          );
        }

        transferAttempt = {
          senderUserId: USER.id,
          recipientUserId: recipientUser.id,
          status: UserTicketTransferStatus.Pending,
          transferMessage: transferInfo.message,
          // Temporary, this will be updated
          // when the payment is done
          expirationDate: new Date(),
          isReturn: false,
        };
      }

      const addonClaims: UserTicketClaimData[0]["addonClaims"] = [];

      for (const addonRequest of itemDetails?.addonRequests || []) {
        const addon = ticketsAndAddonsInfo.addons.find(
          (a) => a.id === addonRequest.addonId,
        );

        if (!addon) {
          throw applicationError(
            `Addon with id ${addonRequest.addonId} not found`,
            ServiceErrors.NOT_FOUND,
            logger,
          );
        }

        const addonClaim: Omit<
          InsertUserTicketAddonClaimSchema,
          "userTicketId"
        > = {
          addonId: addon.id,
          quantity: addonRequest.quantity,
          purchaseOrderId: purchaseOrderRecord.id,
          unitPriceInCents: 0,
          redemptionStatus: UserTicketAddonRedemptionStatus.PENDING,
        };

        addonClaims.push(addonClaim);
      }

      newTickets.push({
        ticket: newTicket,
        transferAttempt,
        addonClaims,
      });
    }

    return newTickets;
  });
}

async function saveUserTicketsAndRelatedData(
  DB: ORM_TYPE,
  ticketsToClaim: UserTicketClaimData,
): Promise<SelectUserTicketSchema[]> {
  const createdTickets: SelectUserTicketSchema[] = [];
  const transferAttemptsToInsert: InsertUserTicketTransferSchema[] = [];
  const addonClaimsToInsert: InsertUserTicketAddonClaimSchema[] = [];

  // since each ticket has its own transfer attempt
  // we cannot insert them in bulk because the returned id is needed
  // for the transfer attempt and the "returning" clause
  // could return the tickets in any order
  const createTicketsPromises = ticketsToClaim.map(async (ticketData) => {
    const [createdTicket] = await DB.insert(userTicketsSchema)
      .values(ticketData.ticket)
      .returning();

    createdTickets.push(createdTicket);

    if (ticketData.transferAttempt) {
      transferAttemptsToInsert.push({
        ...ticketData.transferAttempt,
        userTicketId: createdTicket.id,
      });
    }

    addonClaimsToInsert.push(
      ...ticketData.addonClaims.map((addonClaim) => ({
        ...addonClaim,
        userTicketId: createdTicket.id,
      })),
    );

    return createdTicket;
  });

  await Promise.all(createTicketsPromises);

  // Insert transfer attempts and addon claims if any
  await Promise.all([
    transferAttemptsToInsert.length > 0
      ? DB.insert(userTicketTransfersSchema)
          .values(transferAttemptsToInsert)
          .returning()
      : Promise.resolve([]),
    addonClaimsToInsert.length > 0
      ? DB.insert(userTicketAddonsSchema)
          .values(addonClaimsToInsert)
          .returning()
      : Promise.resolve([]),
  ]);

  return createdTickets;
}

async function verifyFinalUserTicketCounts(
  DB: ORM_TYPE,
  ticketInfo: TicketClaimTicketsInfo,
  USER: NonNullable<Context["USER"]>,
  logger: Logger,
) {
  const validApprovalStatuses: UserTicketApprovalStatus[] = [
    "approved",
    "pending",
    "not_required",
    "gifted",
    "gift_accepted",
    "transfer_pending",
    "transfer_accepted",
  ];

  // Bulk query for existing ticket counts
  const ticketCountsPromise = DB.select({
    ticketTemplateId: userTicketsSchema.ticketTemplateId,
    globalCount: count(userTicketsSchema.id),
    userCount: count(
      and(
        eq(userTicketsSchema.userId, USER.id),
        inArray(userTicketsSchema.approvalStatus, validApprovalStatuses),
      ),
    ),
  })
    .from(userTicketsSchema)
    .where(
      and(
        inArray(
          userTicketsSchema.ticketTemplateId,
          ticketInfo.tickets.map((t) => t.id),
        ),
        inArray(userTicketsSchema.approvalStatus, validApprovalStatuses),
      ),
    )
    .groupBy(userTicketsSchema.ticketTemplateId);

  // Bulk query for existing addon claims counts
  const globalAddonClaimCountsPromise = DB.select({
    addonId: userTicketAddonsSchema.addonId,
    globalCount: count(userTicketAddonsSchema.id),
  })
    .from(userTicketAddonsSchema)
    .innerJoin(
      userTicketsSchema,
      eq(userTicketAddonsSchema.userTicketId, userTicketsSchema.id),
    )
    .where(inArray(userTicketsSchema.approvalStatus, validApprovalStatuses))
    .groupBy(userTicketAddonsSchema.addonId);

  // Bulk query for existing addon claims counts
  // that are associated to the user by addon and ticket template
  const userAddonClaimCountsPromise = DB.select({
    addonId: userTicketAddonsSchema.addonId,
    ticketTemplateId: userTicketsSchema.ticketTemplateId,
    userCount: count(userTicketAddonsSchema.id),
  })
    .from(userTicketAddonsSchema)
    .innerJoin(
      userTicketsSchema,
      eq(userTicketAddonsSchema.userTicketId, userTicketsSchema.id),
    )
    .where(
      and(
        inArray(userTicketsSchema.approvalStatus, validApprovalStatuses),
        eq(userTicketsSchema.userId, USER.id),
      ),
    )
    .groupBy(
      userTicketAddonsSchema.addonId,
      userTicketsSchema.ticketTemplateId,
    );

  const [ticketCounts, globalAddonClaimCounts, userAddonClaimCounts] =
    await Promise.all([
      ticketCountsPromise,
      globalAddonClaimCountsPromise,
      userAddonClaimCountsPromise,
    ]);

  for (const ticketTemplate of ticketInfo.tickets) {
    const countInfo = ticketCounts.find(
      (count) => count.ticketTemplateId === ticketTemplate.id,
    );
    const globalCount = countInfo?.globalCount ?? 0;
    const userCount = countInfo?.userCount ?? 0;

    const limitAlreadyReached = ticketTemplate.quantity
      ? globalCount > ticketTemplate.quantity
      : false;

    logger.info(
      `Ticket template with id ${
        ticketTemplate.id
      } has ${globalCount} tickets ${
        limitAlreadyReached ? "and has reached its limit" : ""
      }`,
    );

    // if the ticket has a quantity field, we  do a last check to see
    // if we have enough gone over the limit of tickets.
    if (limitAlreadyReached) {
      throw applicationError(
        `We have gone over the limit of tickets for ticket template with id ${ticketTemplate.id}`,
        ServiceErrors.FAILED_PRECONDITION,
        logger,
      );
    }

    if (
      ticketTemplate.maxTicketsPerUser &&
      userCount > ticketTemplate.maxTicketsPerUser
    ) {
      throw applicationError(
        `Ticket limit per user exceeded for ticket template ${ticketTemplate.id}`,
        ServiceErrors.FAILED_PRECONDITION,
        logger,
      );
    }
  }

  for (const addon of ticketInfo.addons) {
    const globalCount =
      globalAddonClaimCounts.find((count) => count.addonId === addon.id)
        ?.globalCount ?? 0;

    const limitAlreadyReached = addon.totalStock
      ? globalCount > addon.totalStock
      : false;

    if (limitAlreadyReached) {
      throw applicationError(
        `We have gone over the limit of addons for addon with id ${addon.id}`,
        ServiceErrors.FAILED_PRECONDITION,
        logger,
      );
    }

    for (const ticketTemplate of ticketInfo.tickets) {
      const userCount =
        userAddonClaimCounts.find(
          (count) =>
            count.addonId === addon.id &&
            count.ticketTemplateId === ticketTemplate.id,
        )?.userCount ?? 0;

      if (addon.maxPerTicket && userCount > addon.maxPerTicket) {
        throw applicationError(
          `Addon limit per user exceeded for addon with id ${addon.id} and ticket template ${ticketTemplate.id}`,
          ServiceErrors.FAILED_PRECONDITION,
          logger,
        );
      }
    }
  }
}

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
