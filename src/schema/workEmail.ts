import { eq } from "drizzle-orm";
import { v4 } from "uuid";
import { builder } from "~/builder";
import {
  companiesSchema,
  selectCompaniesSchema,
  confirmationTokenSchema,
  insertCompaniesSchema,
  insertConfirmationTokenSchema,
  insertWorkEmailSchema,
  selectWorkEmailSchema,
  workEmailSchema,
} from "~/datasources/db/schema";
import {
  WorkEmailRef,
  ValidatedWorkEmailRef,
  CompanyRef,
} from "~/schema/shared/refs";
import { enqueueEmail } from "../datasources/queues/mail";
import { statusEnumOptions } from "../datasources/db/shared";

const EmailStatusEnum = builder.enumType("EmailStatus", {
  values: statusEnumOptions,
});

builder.objectType(WorkEmailRef, {
  description: "Representation of a (yet to validate) work email",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    isValidated: t.field({
      type: "Boolean",
      nullable: false,
      resolve: async (root, args, { USER, DB }) => {
        // TODO: Consider also  checking if the confirmationDate is over a year old.
        /* c8 ignore next 3 */
        if (!USER) {
          return false;
        }
        const workEmailSchema = await DB.query.workEmailSchema.findFirst({
          where: (wes, { eq, and }) =>
            and(eq(wes.id, root.id), eq(wes.userId, USER.id)),
        });
        return Boolean(workEmailSchema?.confirmationDate) || false;
      },
    }),
  }),
});
builder.objectType(ValidatedWorkEmailRef, {
  description: "Representation of a validated work email",
  fields: (t) => ({
    // ID and isValidated are the same from WorkEmailRef.
    id: t.exposeString("id", { nullable: false }),
    isValidated: t.field({
      type: "Boolean",
      nullable: false,
      resolve: async (root, args, { USER, DB }) => {
        // TODO: Consider also  checking if the confirmationDate is over a year old.
        /* c8 ignore next 3 */
        if (!USER) {
          return false;
        }
        const workEmailSchema = await DB.query.workEmailSchema.findFirst({
          where: (wes, { eq, and }) =>
            and(eq(wes.id, root.id), eq(wes.userId, USER.id)),
        });
        return Boolean(workEmailSchema?.confirmationDate) || false;
      },
    }),
    workEmail: t.exposeString("workEmail", { nullable: false }),
    status: t.field({
      type: EmailStatusEnum,
      nullable: false,
      resolve: (root) => root.status || "pending",
    }),
    confirmationDate: t.expose("confirmationDate", {
      type: "DateTime",
      nullable: true,
    }),
    company: t.field({
      type: CompanyRef,
      nullable: true,
      resolve: async (root, args, { DB }) => {
        const { companyId } = root;
        if (!companyId) {
          return null;
        }
        const company = await DB.query.companiesSchema.findFirst({
          where: (c, { eq }) => eq(c.id, companyId),
        });
        if (!company) {
          return null;
        }
        return selectCompaniesSchema.parse(company);
      },
    }),
  }),
});

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
        where: (wes, { eq }) => eq(wes.userId, USER.id),
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
      const workEmail = await DB.query.workEmailSchema.findFirst({
        where: (wes, { like }) => like(wes.workEmail, email.toLowerCase()),
        with: {
          user: true,
        },
      });
      if (workEmail?.user?.id !== USER?.id) {
        throw new Error("You don't have access");
      }
      return selectWorkEmailSchema.parse(workEmail);
    },
  }),
}));

builder.mutationFields((t) => ({
  startWorkEmailValidation: t.field({
    description:
      "Kickoff the email validation flow. This flow will links an email to a user, create a company if it does not exist, and allows filling data for that email's position",
    type: WorkEmailRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      email: t.arg.string({ required: true }),
    },
    resolve: async (root, { email }, { DB, USER, MAIL_QUEUE }) => {
      if (!USER) {
        throw new Error("User is required");
      }
      const emailDomain = email.split("@")?.[1];
      if (!emailDomain) {
        throw new Error("Invalid email");
      }

      console.log("Validation for if a Company for this email exists");
      const possibleCompany = await DB.query.companiesSchema.findFirst({
        where: (c, { eq }) => eq(c.domain, emailDomain),
      });
      let companyId = possibleCompany?.id;
      // We need the get the company id via the email domain, (or we create a company if it doesn't exist)
      if (!companyId) {
        console.log(
          "No company exists, creating company for domain",
          emailDomain,
        );
        const insertCompany = insertCompaniesSchema.parse({
          id: v4(),
          domain: emailDomain,
        });

        const newCompany = await DB.insert(companiesSchema)
          .values(insertCompany)
          .returning()
          .get();
        companyId = newCompany.id;
      } else {
        console.log(
          "Company exists for domain ",
          emailDomain,
          " won't create a new one",
        );
      }

      console.log("Checking if the user has added this work email");
      // Find the work email, if it exists we update it and retrigger the flow, if not, create the work email and trigger the flow
      const workEmail = await DB.query.workEmailSchema.findFirst({
        where: (wes, { like, and, eq }) =>
          and(
            like(wes.workEmail, email.toLowerCase()),
            eq(wes.userId, USER.id),
          ),
        with: {
          confirmationToken: true,
        },
      });
      if (workEmail) {
        console.log("Validation for this work email already exists");
        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + 1);
        if (workEmail.confirmationToken) {
          console.log("There is a token also for this work email");
          if (workEmail.confirmationToken.validUntil > currentDate) {
            throw new Error(
              "You can only request a new confirmation email once per hour",
            );
          } else {
            console.log(
              "Updating the expiration date for the validation token",
            );
            await DB.update(confirmationTokenSchema)
              .set({
                status: "expired",
                validUntil: currentDate,
                confirmationDate: null,
              })
              .where(
                eq(confirmationTokenSchema.id, workEmail.confirmationToken.id),
              )
              .execute();
          }
        } else {
          console.log("There is a valid validation token");
        }
        const insertWorkEmailToken = insertConfirmationTokenSchema.parse({
          id: v4(),
          source: "onboarding",
          sourceId: workEmail.id,
          userId: USER.id,
          token: v4(),
          // by default, the token is valid for 1 hour
          validUntil: new Date(Date.now() + 1000 * 60 * 60),
        });
        const insertedToken = await DB.insert(confirmationTokenSchema)
          .values(insertWorkEmailToken)
          .returning()
          .get();

        const updatedWorkEmail = await DB.update(workEmailSchema)
          .set({
            confirmationTokenId: insertedToken.id,
            companyId,
          })
          .returning()
          .get();

        await enqueueEmail(MAIL_QUEUE, {
          code: insertedToken.token,
          userId: USER.id,
          to: email.toLowerCase(),
        });
        return selectWorkEmailSchema.parse(updatedWorkEmail);
      } else {
        console.log(
          "There is no validation request for this work email. Creating the email and the token",
        );
        const insertWorkEmail = insertWorkEmailSchema.parse({
          id: v4(),
          userId: USER.id,
          workEmail: email.toLowerCase(),
          companyId,
        });

        const insertedWorkEmail = await DB.insert(workEmailSchema)
          .values(insertWorkEmail)
          .returning()
          .get();

        console.log("Inserting the email");
        const insertWorkEmailToken = insertConfirmationTokenSchema.parse({
          id: v4(),
          source: "onboarding",
          sourceId: insertedWorkEmail.id,
          userId: USER.id,
          token: v4(),
          // by default, the token is valid for 1 hour
          validUntil: new Date(Date.now() + 1000 * 60 * 60),
        });

        console.log("Inserting the token");
        const insertedToken = await DB.insert(confirmationTokenSchema)
          .values(insertWorkEmailToken)
          .returning()
          .get();

        console.log("Ataching the token to the email");
        await DB.update(workEmailSchema)
          .set({
            confirmationTokenId: insertedToken.id,
          })
          .where(eq(workEmailSchema.id, insertedWorkEmail.id))
          .returning()
          .get();

        console.log("Enqueuing the email");
        await enqueueEmail(MAIL_QUEUE, {
          userId: USER.id,
          code: insertedToken.token,
          to: email.toLowerCase(),
        });

        console.log("Enqueued email to send");
        return selectWorkEmailSchema.parse(insertedWorkEmail);
      }
    },
  }),
  validateWorkEmail: t.field({
    description: "Validates work email for a user",
    type: WorkEmailRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      confirmationToken: t.arg.string({ required: true }),
    },
    resolve: async (root, { confirmationToken }, { DB, USER }) => {
      if (!USER) {
        throw new Error("User is required");
      }
      if (!confirmationToken) {
        throw new Error("confirmationToken is required");
      }

      const foundConfirmationToken =
        await DB.query.confirmationTokenSchema.findFirst({
          where: (c, { eq, and, inArray }) =>
            and(
              eq(c.token, confirmationToken),
              inArray(c.status, ["pending"]),
              inArray(c.source, ["onboarding", "work_email"]),
            ),
        });
      if (!foundConfirmationToken) {
        throw new Error("Invalid token");
      }

      if (
        foundConfirmationToken.validUntil <= new Date() ||
        foundConfirmationToken.userId !== USER.id
      ) {
        throw new Error("Invalid token");
      }
      const possibleWorkSchema = await DB.query.workEmailSchema.findFirst({
        where: (wes, { eq, and }) =>
          and(
            eq(wes.confirmationTokenId, foundConfirmationToken.id),
            eq(wes.userId, USER.id),
          ),
      });
      if (possibleWorkSchema) {
        // TODO: Consider also checking if the confirmationDate is over a year old.
        if (possibleWorkSchema.status === "confirmed") {
          throw new Error("Email is already validated");
        }
        const updatedWorkEmail = await DB.update(workEmailSchema)
          .set({
            status: "confirmed",
            confirmationTokenId: null,
            confirmationDate: new Date(),
          })
          .where(eq(workEmailSchema.id, possibleWorkSchema.id))
          .returning()
          .get();
        return selectWorkEmailSchema.parse(updatedWorkEmail);
      } else {
        throw new Error("No email found for that token");
      }
    },
  }),
}));
