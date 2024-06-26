import { Container, Hr, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

import { BigFooter, TicketTemplate } from "emails/helpers/tickets";

interface AddedToWaitlist {
  nombre?: string | null;
}

export const IACampWaitlist = ({ nombre }: AddedToWaitlist) => {
  return (
    <TicketTemplate>
      <Container className="bg-dark px-10 py-10 w-full max-w-2xl">
        <Section className="text-light">
          <Preview>
            ¡Gracias por registrarte al webinar de AI Hackathon!
          </Preview>

          <Text className="text-4xl mb-8 text-center">AI Hackathon</Text>

          {nombre && <Text className="text-xl mb-4">Hey {nombre}!</Text>}

          <Text className="text-xl mb-8">
            Confirmamos tu registro al webinar que tendremos el próximo 8 de
            julio a las 6:00 pm (hora Santiago, Chile). Antes del evento te
            enviaremos el link de acceso.
          </Text>

          <Text className="text-xl mb-8">
            Durante este webinar resolveremos todas tus dudas y abriremos las
            postulaciones para participar en la primera hackathon de OpenAI en
            Latinoamérica.
          </Text>

          <Text className="text-xl">Un saludo,</Text>
          <Text className="text-xl mb-8">Equipo CommunityOS</Text>
        </Section>
        <Hr className="my-8" />
        <BigFooter />
      </Container>
    </TicketTemplate>
  );
};

export default IACampWaitlist;
