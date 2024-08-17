import {
  Button,
  CodeInline,
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
  userEmail: string;
  eventLogoCloudflareImageURL: string;
}

export const WaitlistAccepted = ({
  eventName,
  userName,
  eventLogoCloudflareImageURL,
  userEmail,
}: EmailProps) => {
  return (
    <TicketTemplate theme="light">
      <Container className="px-10 py-10 w-full max-w-3xl font-light">
        <Section className="">
          <Preview>Tienes una invitación a {eventName}</Preview>
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

          <Text className="text-xl mb-12 ">
            Nos complace informarte que ganaste un ticket para asistir a:
          </Text>

          <Text className="text-xl text-center mb-16 px-8 text-gray-500">
            {eventName}
          </Text>

          <Text className="text-xl mb-12">
            Ingresa con tu correo{" "}
            <CodeInline className="font-regular italic">{userEmail}</CodeInline>
            , conoce los detalles y completa tus datos para que podamos{" "}
            <span className="font-semibold">confirmar tu asistencia</span>.
          </Text>

          <Text className="mb-4 text-center">
            <Button
              href="https://communityos.io/ai-hackathon/tickets"
              className="bg-black py-4 px-6 rounded-3xl text-gray-200 self-center"
              target="_blank"
            >
              Obtener ticket
            </Button>
          </Text>
          <Text className="text-sm mb-12 max-w-xs text-center mx-auto">
            Si no completas este paso, liberaremos el ticket para otra persona.
          </Text>

          <Text className="text-xl mb-16">
            Nos alegra que puedas ser parte de la primera hackathon y
            conferencia de OpenAI en Latinoamérica.
          </Text>

          <Text className="text-xl mb-4">Nos vemos en el evento,</Text>
          <Text className="text-xl font-semibold mb-4">Equipo CommunityOS</Text>
        </Section>
        <Hr className="my-8 border-black" />
        <BigFooter theme="light" />
      </Container>
    </TicketTemplate>
  );
};

WaitlistAccepted.PreviewProps = {
  eventName: "El Potencial Clave de la Recuperación Aumentada (RAG) con OpenAI",
  userName: "John Doe",
  userEmail: "fake@email.com",
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/6cdd148e-b931-4b7a-f983-d75d388aff00",
} satisfies EmailProps;

export default WaitlistAccepted;
