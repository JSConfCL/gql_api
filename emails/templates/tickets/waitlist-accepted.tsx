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

import { BigFooter, TicketTemplate } from "emails/helpers/tickets";

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
    <TicketTemplate>
      <Container className="bg-dark px-10 py-10 w-full max-w-2xl">
        <Section className="text-light">
          <Preview>¡Felicidades! Tienes un lugar en {eventName}</Preview>
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
            ¡Grandes noticias! Nos complace informarte que has sido seleccionado
            para asistir a:
          </Text>

          <Text className="text-xl text-center mb-8 px-4 text-gray-400">
            {eventName}
          </Text>

          <Text className="text-xl mb-8">
            Tu lugar ha sido confirmado, y estamos emocionados de tenerte con
            nosotros. Ingresa a tu cuenta asociada a este correo, para ver los
            detalles del evento.
          </Text>
          <Text className="mb-8 text-center">
            <Button
              href="https://communityos.io/tickets"
              className="bg-blue-800 py-4 px-6 rounded-md text-gray-200 self-center"
              target="_blank"
            >
              Ingresa aquí
            </Button>
          </Text>

          <Text className="text-xl mb-8">
            Por favor, asegúrate de traer tu confirmación de ticket, el día del
            evento.
          </Text>

          <Text className="text-xl mb-8">
            Nos vemos en el evento!,
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

WaitlistRejected.PreviewProps = {
  eventName: "El Potencial Clave de la Recuperación Aumentada (RAG) con OpenAI",
  userName: "John Doe",
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/b6b43de1-d360-4faf-bd7a-7421e8fc1f00",
} satisfies EmailProps;

export default WaitlistRejected;
