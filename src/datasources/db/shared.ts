import { timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const createdAndUpdatedAtFields = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  deletedAt: timestamp("deleted_at"),
};

export const createdAndUpdatedAtFieldsSelectZodSchema = {
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional(),
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
