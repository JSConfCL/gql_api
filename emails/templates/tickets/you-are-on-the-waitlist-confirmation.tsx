import {
  Column,
  Container,
  Hr,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import { BigFooter, TicketTemplate } from "emails/templates/helpers/tickets";

interface EmailProps {
  eventName: string;
  userName?: string;
  eventLogoCloudflareImageURL: string;
}

export const YouAreOnTheWaitlist = ({
  eventName,
  userName,
  eventLogoCloudflareImageURL,
}: EmailProps) => {
  return (
    <TicketTemplate theme="light">
      <Container className="px-10 py-10 w-full max-w-2xl">
        <Section className="">
          <Preview>Estas en la Lista de espera para {eventName}</Preview>
          <Row className="h-20 mb-14">
            <Column>
              <Img
                src={`${eventLogoCloudflareImageURL}/w=300,fit=scale-down`}
                className="w-full max-w-[200px]"
              />
            </Column>
          </Row>

          <Text className="text-2xl mb-6">
            {userName ? `Hola ${userName},` : "Hola,"}
          </Text>

          <Text className="text-xl mb-16 ">
            Actualmente estás en la lista de espera para el evento:
          </Text>

          <Text className="text-xl text-center mb-16 px-4 text-gray-400">
            {eventName}
          </Text>

          <Text className="text-xl">
            Esto significa que, si se libera un espacio, te notificaremos
            mediante esta vía para ofrecerte un lugar.
          </Text>

          <Text className="text-xl mb-16">
            Mientras tanto, te invitamos a seguir nuestras redes sociales y
            visitar nuestro sitio web para estar al tanto de cualquier
            actualización o anuncio relacionado con el evento.
          </Text>

          <Text className="text-xl mb-8">Un saludo,</Text>
          <Text className="text-xl font-semibold mb-8">Equipo CommunityOS</Text>
          <Text className="text-xl mb-16"></Text>
        </Section>
        <Hr className="my-8 border-black" />
        <BigFooter theme="light" />
      </Container>
    </TicketTemplate>
  );
};

YouAreOnTheWaitlist.PreviewProps = {
  eventName: "El Potencial Clave de la Recuperación Aumentada (RAG) con OpenAI",
  userName: "John Doe",
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/6cdd148e-b931-4b7a-f983-d75d388aff00",
} satisfies EmailProps;

export default YouAreOnTheWaitlist;
