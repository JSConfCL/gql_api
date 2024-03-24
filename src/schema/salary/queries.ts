import { builder } from "~/builder";
import { selectSalariesSchema } from "~/datasources/db/schema";
import { SalaryRef } from "~/schema/shared/refs";

builder.queryFields((t) => ({
  salaries: t.field({
    description: "Get a list of salaries associated to the user",
    type: [SalaryRef],
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, _, { DB, USER }) => {
      if (!USER) {
        throw new Error("No user present");
      }
      const salaries = await DB.query.salariesSchema.findMany({
        where: (salary, { eq }) => eq(salary.userId, USER.oldId),
      });
      return salaries.map((salary) => selectSalariesSchema.parse(salary));
    },
  }),
}));
