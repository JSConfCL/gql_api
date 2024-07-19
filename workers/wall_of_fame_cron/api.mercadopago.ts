import { Logger } from "pino";

import { ORM_TYPE, getDb } from "~/datasources/db";
import {
  insertUsersToTagsSchema,
  insertTagsSchema,
  tagsSchema,
  usersTagsSchema,
  AllowedUserTags,
  insertPaymentLogsSchema,
  paymentLogsSchema,
} from "~/datasources/db/schema";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";

import { ENV } from "./types";
import { ResultItem, SearchResponse } from "./types/mercadopago.api.types";

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

export const syncMercadopagoPaymentsAndSubscriptions = async (
  env: ENV,
  logger: Logger<never>,
) => {
  const DB = await getDb({
    neonUrl: env.NEON_URL,
    logger,
  });
  const meliFetch = getFetch(env);
  let results: ResultItem[] = [];
  const url = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc`;
  const subscriptions = (await meliFetch(url)) as SearchResponse;

  results = [...results, ...(subscriptions?.results ?? [])];
  await savePaymentEntry(DB, results, logger);
  await addTagsToDonorUsers(DB, results, logger);
};

const addTagsToDonorUsers = async (
  DB: ORM_TYPE,
  results: ResultItem[],
  logger: Logger<never>,
) => {
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
      logger.error("Error processing", (error as Error).message);
    }
  }
};

const savePaymentEntry = async (
  DB: ORM_TYPE,
  results: ResultItem[],
  logger: Logger<never>,
) => {
  try {
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
      .onConflictDoNothing()
      .returning();

    logger.info("👉Saved", saved.length, "financial entries from mercadopago", {
      saved,
    });
  } catch (e) {
    logger.error("Error saving payment entries", e);
  }
};
