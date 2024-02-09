/* eslint-disable no-console */
import { ORM_TYPE, getDb } from "../../src/datasources/db";
import { ENV } from "./types";
import {
  insertUsersToTagsSchema,
  insertTagsSchema,
  tagsSchema,
  usersTagsSchema,
  AllowedUserTags,
  insertPaymentLogsSchema,
  paymentLogsSchema,
} from "../../src/datasources/db/schema";
import { sanitizeForLikeSearch } from "../../src/schema/shared/helpers";
import { ResultItem, SearchResponse } from "./types/mercadopago.api.types";

const externalReferences = {
  "1LUKA": "1LUKA",
  "5LUKAS": "5LUKAS",
  "10LUKAS": "10LUKAS",
  DONACION_JSCHILE: "DONACION_JSCHILE",
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

export const syncMercadopagoPaymentsAndSubscriptions = async (env: ENV) => {
  const DB = getDb({
    neonUrl: env.NEON_URL,
  });
  const meliFetch = getFetch(env);
  let results: ResultItem[] = [];
  for await (const [externalReference, externalReferenceId] of Object.entries(
    externalReferences,
  )) {
    console.log("Searching for", externalReference);
    const subscriptions = (await meliFetch(
      `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&external_reference=${externalReferenceId}`,
    )) as SearchResponse;
    results = [...results, ...(subscriptions?.results ?? [])];
  }
  await savePaymentEntry(DB, results);
  await addTagsToDonorUsers(DB, results);

  console.log("👉Results", results.length);
};

const addTagsToDonorUsers = async (DB: ORM_TYPE, results: ResultItem[]) => {
  const tagToInsert = insertTagsSchema.parse({
    name: AllowedUserTags.DONOR,
    description: "Usuario Donador",
  });

  await DB.insert(tagsSchema).values(tagToInsert).onConflictDoNothing();

  const tag = await DB.query.tagsSchema.findFirst({
    where: (tags, { eq }) => eq(tags.name, AllowedUserTags.DONOR),
  });
  if (!tag) {
    throw new Error(`Missing TAG: ${AllowedUserTags.DONOR}`);
  }

  console.log("Results", results.length);
  for await (const subscription of results) {
    try {
      const email = subscription.payer.email;
      if (!email) {
        throw new Error("Email not found for subscription");
      }
      const user = await DB.query.usersSchema.findFirst({
        where: (u, { ilike }) => ilike(u.name, sanitizeForLikeSearch(email)),
      });
      if (!user) {
        throw new Error("User not found");
      }
      const userTag = insertUsersToTagsSchema.parse({
        tagId: tag.id,
        userId: user.id,
      });
      await DB.insert(usersTagsSchema)
        .values(userTag)
        .returning()
        .onConflictDoNothing();
    } catch (error) {
      console.error("Error processing", error);
    }
  }
};

const savePaymentEntry = async (DB: ORM_TYPE, results: ResultItem[]) => {
  try {
    console.log("👉 Attempting to save", results.length, " items");
    const mappedResults = results.map((result) => {
      return insertPaymentLogsSchema.parse({
        externalId: result.id.toString(),
        externalProductReference: result.external_reference,
        platform: "mercadopago",
        transactionAmount: result.transaction_amount.toString(),
        externalCreationDate: new Date(result.date_created),
        currencyId: result.currency_id,
        originalResponseBlob: result,
      });
    });
    const saved = await DB.insert(paymentLogsSchema)
      .values(mappedResults)
      .returning();
    console.log("👉Saved", saved.length, "financial entries from mercadopago");
  } catch (e) {
    console.log("Error saving payment entries", e);
    console.error(e);
  }
};
