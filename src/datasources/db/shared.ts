import { timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const createdAndUpdatedAtFields = {
  createdAt: timestamp("created_at", {
    precision: 6,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    precision: 6,
  }),
  deletedAt: timestamp("deleted_at", {
    precision: 6,
  }),
};

export const createdAndUpdatedAtFieldsSelectZodSchema = {
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional(),
};

export enum GenderOptionsEnum {
  Male = "male",
  Female = "female",
  TransgenderMale = "transgender_male",
  TransgenderFemale = "transgender_female",
  NonBinary = "non_binary",
  Genderqueer = "genderqueer",
  Genderfluid = "genderfluid",
  Agender = "agender",
  TwoSpirit = "two_spirit",
  Other = "other",
  PreferNotToSay = "prefer_not_to_say",
  empty = "",
}

export const statusEnumOptions = ["pending", "confirmed", "rejected"] as const;

type EnumValuesAsTuple<E> = [E[keyof E]];

export const TypescriptEnumAsDBEnumOptions = <
  E extends Record<string, unknown>,
>(
  enumObject: E,
) => {
  return Object.values(enumObject) as EnumValuesAsTuple<E>;
};
