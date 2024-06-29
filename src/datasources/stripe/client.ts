import Stripe from "stripe";

let stripeClient: Stripe | null = null;
export const getStripeClient = (stripeKey: string) => {
  if (!stripeClient) {
    stripeClient = new Stripe(stripeKey);
  }

  return stripeClient;
};
