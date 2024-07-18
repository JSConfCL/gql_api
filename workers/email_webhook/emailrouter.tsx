/* eslint-disable no-case-declarations */
import { renderAsync } from "@react-email/render";
import { Logger } from "pino";
import React from "react";
import type { Resend } from "resend";

import { AIHackathonPostulationWithTeamEmail } from "../../emails/templates/iacamp/postulation-with-team";
import { AIHackathonPostulationWithoutTeamEmail } from "../../emails/templates/iacamp/postulation-without-team";
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
  logger,
}: {
  emailTemplate: string;
  body: unknown;
  resend: Resend;
  logger: Logger<never>;
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

    return sendTransactionalHTMLEmail(resend, logger, {
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

    return sendTransactionalHTMLEmail(resend, logger, {
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
  } else if (emailTemplate === "postulacion-ai-hackathon-con-equipo") {
    const {
      data: { fields },
    } = body as TallyWebhookProps;
    const email = fields.find((field) => field.key === "question_gb24KM")
      ?.value;
    const name = fields.find((field) => field.key === "question_J1705z")?.value;

    if (!email) {
      throw new Error("Email is required");
    }

    const htmlContent = await renderAsync(
      <AIHackathonPostulationWithTeamEmail name={name || ""} />,
    );

    return sendTransactionalHTMLEmail(resend, logger, {
      htmlContent,
      from: {
        name: "AI Hackathon - by CommunityOS",
        email: "contacto@communityos.io",
      },
      subject: "Hemos recibido tu postulación a AI Hackathon.",
      to: [
        {
          name,
          email,
        },
      ],
    });
  } else if (emailTemplate === "postulacion-ai-hackathon-sin-equipo") {
    const {
      data: { fields },
    } = body as TallyWebhookProps;
    const email = fields.find((field) => field.key === "question_OQOXWa")
      ?.value;
    const name = fields.find((field) => field.key === "question_q50RA7")?.value;

    if (!email) {
      throw new Error("Email is required");
    }

    const htmlContent = await renderAsync(
      <AIHackathonPostulationWithoutTeamEmail name={name || ""} />,
    );

    return sendTransactionalHTMLEmail(resend, logger, {
      htmlContent,
      from: {
        name: "AI Hackathon - by CommunityOS",
        email: "contacto@communityos.io",
      },
      subject: "Hemos recibido tu registro a AI Hackathon.",
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
