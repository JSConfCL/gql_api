import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const createdAndUpdatedAtFields = {
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`current_timestamp`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }),
  deletedAt: timestamp("deleted_at", { mode: "date", withTimezone: true }),
};

export const genderOptions = [
  "male",
  "female",
  "transgender_male",
  "transgender_female",
  "non_binary",
  "genderqueer",
  "genderfluid",
  "agender",
  "two_spirit",
  "other",
  "prefer_not_to_say",
] as const;

export const statusEnumOptions = ["pending", "confirmed", "rejected"] as const;
