import {
  Button,
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

export const WaitlistRejected = ({
  eventName,
  userName,
  eventLogoCloudflareImageURL,
}: EmailProps) => {
  return (
    <TicketTemplate theme="light">
      <Container className="px-10 py-10 w-full max-w-2xl font-light">
        <Section className="">
          <Preview>Gracias por tu interés en {eventName}</Preview>
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

          <Text className="text-xl mb-12">
            Agradeceemos tu interés en asistir a:
          </Text>
          <Text className="text-xl text-center mb-8 px-4 text-gray-500">
            {eventName}
          </Text>
          <Text className="text-xl mb-12">
            Lamentablemente, debido a la alta demanda y al espacio limitado, no
            pudimos acomodarte en esta ocasión.
          </Text>

          <Text className="text-xl mb-12">
            ¡Pero tenemos buenas noticias! Tendremos streaming del evento y nos
            encantaría que nos acompañes durante todo el evento que
            transmitiremos los días 23, 24 y 25 de agosto.
          </Text>

          <Text className="text-xl mb-12">
            Para que no te pierdas de nada te recomendamos suscribirte a nuestro
            canal de Youtube:
          </Text>

          <Text className="mb-12 text-center">
            <Button
              href="https://www.youtube.com/@CommunityOS?sub_confirmation=1"
              className="bg-black py-4 px-6 rounded-3xl text-gray-200 self-center"
              target="_blank"
            >
              Suscribirme a YouTube
            </Button>
          </Text>

          <Text className="text-xl mb-16">
            También puedes seguirnos en nuestras rédes sociales para estar al
            tanto de todas nuestras novedades y próximos eventos.
          </Text>

          <Text className="text-xl mb-4">Saludos,</Text>
          <Text className="text-xl font-semibold mb-4">Equipo CommunityOS</Text>

          <Text className="text-xl mb-8"></Text>
        </Section>
        <Hr className="my-8 border-black" />
        <BigFooter theme="light" />
      </Container>
    </TicketTemplate>
  );
};

WaitlistRejected.PreviewProps = {
  eventName: "El Potencial Clave de la Recuperación Aumentada (RAG) con OpenAI",
  userName: "John Doe",
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/6cdd148e-b931-4b7a-f983-d75d388aff00",
} satisfies EmailProps;

export default WaitlistRejected;
