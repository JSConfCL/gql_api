import { eq } from "drizzle-orm";

import { builder } from "~/builder";
import { selectWorkEmailSchema } from "~/datasources/db/schema";
import { ValidatedWorkEmailRef, WorkEmailRef } from "~/schema/shared/refs";

builder.queryFields((t) => ({
  workEmails: t.field({
    description: "Get a list of validated work emails for the user",
    type: [ValidatedWorkEmailRef],
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, _, { DB, USER }) => {
      if (!USER) {
        throw new Error("No user present");
      }
      const workEmail = await DB.query.workEmailSchema.findMany({
        where: (wes, { eq }) => eq(wes.userId, USER.oldId),
      });
      return workEmail.map((we) => selectWorkEmailSchema.parse(we));
    },
  }),
  workEmail: t.field({
    description: "Get a workEmail and check if its validated for this user",
    type: WorkEmailRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      email: t.arg.string({ required: true }),
    },
    resolve: async (root, { email }, { DB, USER }) => {
      if (!USER) {
        throw new Error("No user present");
      }
      const userId = USER.oldId;
      const workEmail = await DB.query.workEmailSchema.findFirst({
        where: (wes, { and, ilike }) =>
          and(
            ilike(wes.workEmail, email.toLowerCase()),
            eq(wes.userId, userId),
          ),
      });

      if (!workEmail) {
        throw new Error("You don't have access");
      }
      return selectWorkEmailSchema.parse(workEmail);
    },
  }),
}));
