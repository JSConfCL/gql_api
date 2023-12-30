import { builder } from "~/builder";
import { genderOptions } from "../../datasources/db/shared";

export const GenderEnum = builder.enumType("Gender", {
  values: genderOptions,
});
