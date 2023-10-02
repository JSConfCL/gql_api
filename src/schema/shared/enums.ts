import { builder } from "~/builder";

export const GenderEnum = builder.enumType("Gender", {
  values: [
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
  ],
});
