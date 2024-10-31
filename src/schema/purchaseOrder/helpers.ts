import { ORM_TYPE } from "~/datasources/db";
import {
  insertPurchaseOrdersSchema,
  purchaseOrdersSchema,
} from "~/datasources/db/purchaseOrders";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";

export const getPurchaseRedirectURLsFromPurchaseOrder = async ({
  DB,
  default_redirect_url,
  purchaseOrderId,
}: {
  DB: ORM_TYPE;
  default_redirect_url: string;
  purchaseOrderId: string;
}) => {
  const userTicketsPromise = DB.query.userTicketsSchema.findMany({
    where: (ut, { eq }) => eq(ut.purchaseOrderId, purchaseOrderId),
    with: {
      ticketTemplate: {
        with: {
          event: {
            with: {
              eventsToCommunities: true,
            },
          },
        },
      },
    },
  });

  const userTicketAddonsPromise = DB.query.userTicketAddonsSchema.findMany({
    where: (uat, { eq }) => eq(uat.purchaseOrderId, purchaseOrderId),
    with: {
      userTicket: {
        with: {
          ticketTemplate: {
            with: {
              event: {
                with: {
                  eventsToCommunities: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const [userTickets, userTicketAddons] = await Promise.all([
    userTicketsPromise,
    userTicketAddonsPromise,
  ]);

  if (!userTickets.length && !userTicketAddons.length) {
    throw new Error("Purchase order not found");
  }

  const allRelatedUsersTickets = [
    ...userTickets,
    ...userTicketAddons.map((u) => u.userTicket),
  ];

  if (!allRelatedUsersTickets.length) {
    throw new Error("No tickets found for purchase order");
  }

  const { ticketTemplate } = allRelatedUsersTickets[0];

  if (!ticketTemplate) {
    throw new Error("No tickets found for purchase order");
  }

  const { event } = ticketTemplate;

  if (!event) {
    throw new Error("Event not found for ticket");
  }

  const { eventsToCommunities } = event;

  if (!eventsToCommunities) {
    throw new Error("Event to community not found");
  }

  const communityId = eventsToCommunities[0]?.communityId;

  const community = await DB.query.communitySchema.findFirst({
    where: (c, { eq }) => eq(c.id, communityId),
  });

  let paymentSuccessRedirectURL = default_redirect_url;
  let paymentCancelRedirectURL = default_redirect_url;

  if (community) {
    paymentSuccessRedirectURL =
      community.paymentSuccessRedirectURL ?? paymentSuccessRedirectURL;

    paymentCancelRedirectURL =
      community.paymentCancelRedirectURL ?? paymentCancelRedirectURL;
  }

  paymentSuccessRedirectURL =
    eventsToCommunities[0]?.paymentSuccessRedirectURL ??
    paymentSuccessRedirectURL;

  paymentSuccessRedirectURL =
    eventsToCommunities[0]?.paymentCancelRedirectURL ??
    paymentSuccessRedirectURL;

  return {
    paymentSuccessRedirectURL,
    paymentCancelRedirectURL,
  };
};

export const createInitialPurchaseOrder = async ({
  DB,
  userId,
  logger,
}: {
  DB: ORM_TYPE;
  userId: string;
  logger: Logger;
}) => {
  const createdPurchaseOrders = await DB.insert(purchaseOrdersSchema)
    .values(
      insertPurchaseOrdersSchema.parse({
        userId,
      }),
    )
    .returning()
    .execute();

  const createdPurchaseOrder = createdPurchaseOrders[0];

  if (!createdPurchaseOrder) {
    throw applicationError(
      "Could not create purchase order",
      ServiceErrors.FAILED_PRECONDITION,
      logger,
    );
  }

  return createdPurchaseOrder;
};
