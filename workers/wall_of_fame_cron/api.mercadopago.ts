/* eslint-disable no-console */
import { v5 } from "uuid";
import { getDb } from "../../src/datasources/db";
import {
  donorsSchema,
  insertDonorsSchema,
} from "../../src/datasources/db/donnors";
import { ENV } from "./types";

const externalReferences = {
  "1LUKA": "1LUKA",
  "5LUKAS": "5LUKAS",
  "10LUKAS": "10LUKAS",
};

const getFetch = (env: ENV) => async (url: string) => {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${env.MP_ACCESS_TOKEN}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(url, {
    headers,
  });
  const json = await response.json();
  return json;
};

type Result = {
  id: string;
  operation_type: string;
  payer: {
    id: string;
    email: string;
    first_name: null | string;
    last_name: null | string;
  };
  transaction_details: {
    total_paid_amount: number;
  };
};

const NAMESPACE = "280a6517-3d64-4236-b076-e357bff79f35";
export const getSubscriptions = async (env: ENV) => {
  const DB = getDb({
    authToken: env.DATABASE_TOKEN,
    url: env.DATABASE_URL,
  });
  const meliFetch = getFetch(env);
  let results: Result[] = [];
  for await (const [externalReference, externalReferenceId] of Object.entries(
    externalReferences,
  )) {
    console.log("Searching for", externalReference);
    const subscriptions = (await meliFetch(
      `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&external_reference=${externalReferenceId}`,
    )) as {
      results?: Result[];
    };

    results = [...results, ...(subscriptions?.results || [])];
  }

  console.log("Results", results.length);
  for await (const subscription of results) {
    try {
      const donor = insertDonorsSchema.parse({
        id: v5(subscription.id.toString(), NAMESPACE),
        externalReference: subscription.id.toString(),
        email: subscription.payer.email ?? "",
        name: `${subscription.payer.first_name ?? ""} ${
          subscription.payer.last_name ?? ""
        }`,
        amount: subscription.transaction_details.total_paid_amount,
        operationType: subscription.operation_type,
        // TODO: Add the rest of the fields
      });
      console.info("Inserting donor", donor);
      await DB.transaction(async (trx) => {
        try {
          const insertedDonor = await trx
            .insert(donorsSchema)
            .values(donor)
            .returning()
            .onConflictDoNothing()
            .get();
          console.log("Inserted", insertedDonor);
        } catch (error) {
          console.error("Error inserting", donor, error);
          trx.rollback();
        }
      });
    } catch (error) {
      console.error("Error processing", error);
    }
  }
};
