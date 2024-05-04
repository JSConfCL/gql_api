/* eslint-disable no-case-declarations */
import { renderAsync } from "@react-email/render";
import React from "react";

import { IACampWaitlist } from "../../emails/templates/iacamp/waitlist";
import { sendTransactionalHTMLEmail } from "../../src/datasources/email/sendEmailToWorkers";

export const mailRouter = async (email_template: string, body: unknown) => {
  switch (email_template) {
    case "ia-camp-waitlist":
      const {
        data: { fields },
      } = body as {
        data: {
          fields: Array<{
            key: string;
            label: string;
            type: string;
            value: string;
          }>;
        };
      };
      const email = fields.find((field) => field.key === "question_LD6XlO")
        ?.value;
      const nombre = fields.find((field) => field.key === "question_vXd4kd")
        ?.value;
      if (!email) {
        throw new Error("Email is required");
      }
      const htmlContent = await renderAsync(<IACampWaitlist nombre={nombre} />);
      return sendTransactionalHTMLEmail({
        htmlContent,
        from: {
          name: "IACamp - by CommunityOS",
          email: "contacto@communityos.io",
        },
        subject: "Estás en la lista de espera de IACamp",
        to: [
          {
            email,
            name: nombre,
          },
        ],
      });
    default:
      return { message: "Hello, World!" };
  }
};
