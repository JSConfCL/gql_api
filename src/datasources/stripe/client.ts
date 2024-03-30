import Stripe from "stripe";

let stripeClient: Stripe | null = null;
export const getStripClient = (stripeKey: string) => {
  if (!stripeClient) {
    stripeClient = new Stripe(stripeKey);
  }
  return stripeClient;
};
