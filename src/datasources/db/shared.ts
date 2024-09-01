import { sql } from "drizzle-orm";
import { text, integer } from "drizzle-orm/sqlite-core";
import { z } from "zod";

export const timestamp = (columnName: string) =>
  integer(columnName, { mode: "timestamp_ms" });

export const createdAndUpdatedAtFields = {
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: timestamp("updated_at"),
  deletedAt: timestamp("deleted_at"),
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

export const uuid = (columnName: string) =>
  text(columnName).$defaultFn(() => crypto.randomUUID());

export const boolean = (columnName: string) =>
  integer(columnName, { mode: "boolean" }).$type<boolean>();
