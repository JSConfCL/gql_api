import { builder } from "~/builder";
import { GenderOptionsEnum } from "~workers/db_service/db/shared";

export const GenderEnum = builder.enumType(GenderOptionsEnum, {
  name: "Gender",
});
