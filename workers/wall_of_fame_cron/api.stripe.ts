import Stripe, { Charge } from "stripe";

import { ORM_TYPE, getDb } from "../../src/datasources/db";
import { ENV } from "./types";

import {
  insertPaymentLogsSchema,
  paymentLogsSchema,
} from "../../src/datasources/db/schema";

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

export const syncStripePayments = async (env: ENV) => {
  const DB = getDb({ neonUrl: env.NEON_URL });
  const stripe = new Stripe(env.ST_KEY);

  const results = await stripe.charges.list({ limit: 100 });

  await savePaymentEntry(DB, results.data);
}


const savePaymentEntry = async (DB: ORM_TYPE, results: Charge[]) => {
  try {
    console.log("👉 Attempting to save", results.length, " items");
    const mappedResults = results.map((result: Charge) => {
      return insertPaymentLogsSchema.parse({
        externalId: result.id,
        platform: "stripe",
        externalCreationDate: new Date(result.created * 1000),
        transactionAmount: result.amount.toString(),
        currencyId: result.currency,
        originalResponseBlob: result,
      });
    });

    const saved = await DB.insert(paymentLogsSchema)
      .values(mappedResults)
      .onConflictDoNothing()
      .returning();
    console.log("👉Saved", saved.length, "financial entries from stripe");
  } catch (e) {
    console.log("Error saving payment entries", e);
    console.error(e);
  }
};
