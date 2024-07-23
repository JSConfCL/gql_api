import { ORM_TYPE } from "~/datasources/db";

export const getPurchaseRedirectURLsFromPurchaseOrder = async ({
  DB,
  default_redirect_url,
  purchaseOrderId,
}: {
  DB: ORM_TYPE;
  default_redirect_url: string;
  purchaseOrderId: string;
}) => {
  const po = await DB.query.purchaseOrdersSchema.findFirst({
    where: (pos, { eq }) => eq(pos.id, purchaseOrderId),
    with: {
      userTickets: {
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

  if (!po) {
    throw new Error("Purchase order not found");
  }

  const { userTickets } = po;

  if (!userTickets.length) {
    throw new Error("No tickets found for purchase order");
  }

  const { ticketTemplate } = userTickets[0];

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
    eventsToCommunities[0]?.paymentCancelRedirectURL ??
    paymentSuccessRedirectURL;
  paymentSuccessRedirectURL =
    eventsToCommunities[0]?.paymentCancelRedirectURL ??
    paymentSuccessRedirectURL;

  return {
    paymentSuccessRedirectURL,
    paymentCancelRedirectURL,
  };
};
