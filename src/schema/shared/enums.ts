import { builder } from "~/builder";
import { GenderOptionsEnum } from "~/datasources/db/shared";

export const GenderEnum = builder.enumType(GenderOptionsEnum, {
  name: "Gender",
});
