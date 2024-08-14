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

import { BigFooter, TicketTemplate } from "emails/helpers/tickets";

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
    <TicketTemplate>
      <Container className="bg-dark px-10 py-10 w-full max-w-2xl">
        <Section className="text-light">
          <Preview>Estas en la Lista de espera para {eventName}</Preview>
          <Row className="h-20 mb-14">
            <Column>
              <Img
                src={`${eventLogoCloudflareImageURL}/w=300,fit=scale-down`}
                className="w-full max-w-[200px]"
              />
            </Column>
          </Row>

          {userName ? (
            <Text className="text-2xl mb-6">Hola {userName},</Text>
          ) : (
            <Text className="text-2xl mb-6">Hola,</Text>
          )}

          <Text className="text-xl mb-8 ">
            Actualmente estás en la lista de espera para el evento:
          </Text>

          <Text className="text-xl text-center mb-8 px-4 text-gray-400">
            {eventName}
          </Text>

          <Text>
            Esto significa que, si se libera un espacio, te notificaremos
            inmediatamente para ofrecerte un lugar.
          </Text>

          <Text className="text-xl mb-8">
            Mientras tanto, te invitamos a seguir nuestras redes sociales y
            visitar nuestro sitio web para estar al tanto de cualquier
            actualización o anuncio relacionado con el evento.
          </Text>

          <Text className="text-xl">
            Un saludo,
            <br /> Equipo CommunityOS
          </Text>
          <Text className="text-xl mb-8"></Text>
        </Section>
        <Hr className="my-8" />
        <BigFooter />
      </Container>
    </TicketTemplate>
  );
};

YouAreOnTheWaitlist.PreviewProps = {
  eventName: "El Potencial Clave de la Recuperación Aumentada (RAG) con OpenAI",
  userName: "John Doe",
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/b6b43de1-d360-4faf-bd7a-7421e8fc1f00",
} satisfies EmailProps;

export default YouAreOnTheWaitlist;
