/* eslint-disable no-case-declarations */
import { renderAsync } from "@react-email/render";
import React from "react";
import type { Resend } from "resend";

import { SponsorsConfirmation } from "../../emails/templates/iacamp/sponsors";
import { IACampWaitlist } from "../../emails/templates/iacamp/waitlist";
import { sendTransactionalHTMLEmail } from "../../src/datasources/email/sendEmailToWorkers";

type TallyWebhookProps = {
  data: {
    fields: Array<{
      key: string;
      label: string;
      type: string;
      value: string;
    }>;
  };
};

export const mailRouter = async ({
  emailTemplate,
  body,
  resend,
}: {
  emailTemplate: string;
  body: unknown;
  resend: Resend;
}) => {
  if (emailTemplate === "ia-camp-waitlist") {
    const {
      data: { fields },
    } = body as TallyWebhookProps;
    const email = fields.find((field) => field.key === "question_LD6XlO")
      ?.value;
    const nombre = fields.find((field) => field.key === "question_vXd4kd")
      ?.value;

    if (!email) {
      throw new Error("Email is required");
    }

    const htmlContent = await renderAsync(<IACampWaitlist nombre={nombre} />);

    return sendTransactionalHTMLEmail(resend, {
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
  } else if (emailTemplate === "ia-camp-sponsor") {
    const {
      data: { fields },
    } = body as TallyWebhookProps;
    const email = fields.find((field) => field.key === "question_jekLyE")
      ?.value;
    const name = fields.find((field) => field.key === "question_rDkV6v")?.value;

    if (!email) {
      throw new Error("Email is required");
    }

    const htmlContent = await renderAsync(<SponsorsConfirmation />);

    return sendTransactionalHTMLEmail(resend, {
      htmlContent,
      from: {
        name: "IACamp - by CommunityOS",
        email: "sponsors@communityos.io",
      },
      subject: "Gracias por tu interés en auspiciar IA Camp.",
      to: [
        {
          name,
          email,
        },
      ],
    });
  }

  return { message: "Hello, World!" };
};
