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
      tickets: {
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
        },
      },
    },
  });

  if (!po) {
    throw new Error("Purchase order not found");
  }

  const { tickets } = po;

  if (!tickets.length) {
    throw new Error("No tickets found for purchase order");
  }

  const { event } = tickets[0];

  if (!event) {
    throw new Error("Event not found for ticket");
  }

  const { eventsToCommunities } = event;

  if (!eventsToCommunities) {
    throw new Error("Event to community not found");
  }

  const { community } = eventsToCommunities[0];

  if (!community) {
    throw new Error("Community not found");
  }

  const paymentSuccessRedirectURL =
    eventsToCommunities[0]?.paymentSuccessRedirectURL ??
    community.paymentSuccessRedirectURL ??
    default_redirect_url;

  const paymentCancelRedirectURL =
    eventsToCommunities[0]?.paymentCancelRedirectURL ??
    community.paymentCancelRedirectURL ??
    default_redirect_url;

  return {
    paymentSuccessRedirectURL,
    paymentCancelRedirectURL,
  };
};
