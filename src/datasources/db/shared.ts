import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/sqlite-core";

export const createdAndUpdatedAtFields = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`current_timestamp`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
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
