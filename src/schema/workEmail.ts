import { eq } from "drizzle-orm";
import { v4 } from "uuid";
import { builder } from "~/builder";
import {
  companiesSchema,
  confirmationTokenSchema,
  insertCompaniesSchema,
  insertConfirmationTokenSchema,
  insertWorkEmailSchema,
  selectWorkEmailSchema,
  workEmailSchema,
} from "~/datasources/db/schema";
import { WorkEmailRef } from "~/schema/shared/refs";
import { enqueueEmail } from "../datasources/mail";

builder.objectType(WorkEmailRef, {
  description: "Representation of a workEmail",
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

builder.queryFields((t) => ({
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

      const result = await DB.transaction(async (trx) => {
        try {
          // We get the company id from the email domain, or create it if it doesn't exist
          const possibleCompany = await trx.query.companiesSchema.findFirst({
            where: (c, { eq }) => eq(c.domain, emailDomain),
          });

          let companyId = possibleCompany?.id;
          if (!companyId) {
            const insertCompany = insertCompaniesSchema.parse({
              id: v4(),
              domain: emailDomain,
            });

            const newCompany = await trx
              .insert(companiesSchema)
              .values(insertCompany)
              .returning()
              .get();
            companyId = newCompany.id;
          }

          // Find the work email, if it exists we update it and retrigger the flow, if not, create the work email and trigger the flow
          const workEmail = await trx.query.workEmailSchema.findFirst({
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
            const currentDate = new Date();
            currentDate.setHours(currentDate.getHours() + 1);
            if (workEmail.confirmationToken) {
              if (workEmail.confirmationToken.validUntil > currentDate) {
                throw new Error(
                  "You can only request a new confirmation email once per hour",
                );
              } else {
                await trx
                  .update(confirmationTokenSchema)
                  .set({
                    status: "expired",
                    validUntil: currentDate,
                    confirmationDate: null,
                  })
                  .where(
                    eq(
                      confirmationTokenSchema.id,
                      workEmail.confirmationToken.id,
                    ),
                  )
                  .execute();
              }
            }
            const confirmationToken = v4();
            const insertToken = insertConfirmationTokenSchema.parse({
              id: confirmationToken,
              source: "work_email",
              sourceId: workEmail.id,
              // by default, the token is valid for 1 hour
              validUntil: new Date(Date.now() + 1000 * 60 * 60),
            });
            const insertedToken = await trx
              .insert(confirmationTokenSchema)
              .values(insertToken)
              .returning()
              .get();

            const updatedWorkEmail = await trx
              .update(workEmailSchema)
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
            return updatedWorkEmail;
          } else {
            const confirmationToken = v4();
            const insertWorkEmail = insertWorkEmailSchema.parse({
              id: v4(),
              userId: USER.id,
              workEmail: email.toLowerCase(),
              companyId,
            });

            const insertedWorkEmail = await trx
              .insert(workEmailSchema)
              .values(insertWorkEmail)
              .returning()
              .get();

            const insertToken = insertConfirmationTokenSchema.parse({
              id: v4(),
              source: "work_email",
              sourceId: insertedWorkEmail.id,
              token: confirmationToken,
              // by default, the token is valid for 1 hour
              validUntil: new Date(Date.now() + 1000 * 60 * 60),
            });
            const insertedToken = await trx
              .insert(confirmationTokenSchema)
              .values(insertToken)
              .returning()
              .get();
            await trx
              .update(workEmailSchema)
              .set({
                confirmationTokenId: insertedToken.id,
              })
              .where(eq(workEmailSchema.id, insertedWorkEmail.id))
              .returning()
              .get();

            await enqueueEmail(MAIL_QUEUE, {
              userId: USER.id,
              code: insertedToken.token,
              to: email.toLowerCase(),
            });
            return insertedWorkEmail;
          }
        } catch (e) {
          trx.rollback();
          throw e;
        }
      });
      return selectWorkEmailSchema.parse(result);
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

      const result = await DB.transaction(async (trx) => {
        try {
          const foundConfirmationToken =
            await trx.query.confirmationTokenSchema.findFirst({
              where: (ct, { eq }) => eq(ct.token, confirmationToken),
            });
          if (!foundConfirmationToken) {
            throw new Error("Invalid token");
          }
          const allWorkEmails = await trx.query.workEmailSchema.findMany({});

          const possibleWorkSchema = await trx.query.workEmailSchema.findFirst({
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
            const updatedWorkEmail = await trx
              .update(workEmailSchema)
              .set({
                status: "confirmed",
                confirmationTokenId: null,
                confirmationDate: new Date(),
              })
              .where(eq(workEmailSchema.id, possibleWorkSchema.id))
              .returning()
              .get();
            return updatedWorkEmail;
          } else {
            throw new Error("No email found for that token");
          }
        } catch (e) {
          trx.rollback();
          throw e;
        }
      });
      return selectWorkEmailSchema.parse(result);
    },
  }),
}));
