import { ENV } from "./types";
import Stripe from "stripe";

export const getSubscriptions = async (env: ENV) => {
  const stripe = new Stripe(env.ST_KEY);
  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    created: {
      gte: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
    },
  });

  return subscriptions.data.map((subscription) => {
    const customer = subscription.customer;
    let customerID = customer as string;
    let customerEmail: null | string = null;
    let deletedUser = false;
    if (typeof customer !== "string") {
      customerID = customer.id;
      if (!customer.deleted) {
        customerEmail = customer.email;
      } else {
        deletedUser = true;
      }
    }
    return {
      userId: customerID,
      deletedUser: deletedUser,
      customerEmail: customerEmail,
      subscriptionId: subscription.id,
    };
  });
};
