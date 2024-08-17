import {
  Column,
  Container,
  Hr,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import { BigFooter, TicketTemplate } from "emails/templates/helpers/tickets";

interface EmailProps {
  eventName: string;
  userTicketId: string;
  userName?: string;
  eventLogoCloudflareImageURL: string;
  userEmail: string;
}

export const TicketConfirmation = ({
  eventName,
  userTicketId,
  userName,
  userEmail,
  eventLogoCloudflareImageURL,
}: EmailProps) => {
  return (
    <TicketTemplate theme="light">
      <Container className="px-10 py-10 w-full max-w-3xl font-light">
        <Section className="">
          <Preview>Tu ticket para {eventName}</Preview>
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

          <Text className="text-xl mb-8">
            Este es tu ticket para el evento:
          </Text>

          <Text className="text-xl text-center mb-16 px-8 text-gray-400">
            {eventName}
          </Text>

          <Row>
            <Img
              className="px-20 mb-16"
              src={`https://svg-renderer.communityos.io/qr/svg/${userTicketId}`}
            />
          </Row>

          <Text className="text-xl mb-16">
            Recuerda llevar este ticket contigo el día del evento. <br />
            También está disponible el tu perfil de CommunityOS, ingresa con tu
            correo <span className="font-semibold">{userEmail}</span> en{" "}
            <Link href="https://communityos.io/ai-hackathon/tickets">
              communityos.io/ai-hackathon/tickets
            </Link>
            .
          </Text>

          <Text className="text-xl mb-8">Nos vemos en el evento,</Text>
          <Text className="text-xl font-semibold mb-8">Equipo CommunityOS</Text>

          <Text className="text-xl mb-8"></Text>
        </Section>
        <Hr className="my-8 border-black" />
        <BigFooter theme="light" />
      </Container>
    </TicketTemplate>
  );
};

TicketConfirmation.PreviewProps = {
  eventName: "El Potencial Clave de la Recuperación Aumentada (RAG) con OpenAI",
  userName: "John Doe",
  userTicketId: "c7fa5dc0-ffa2-4369-bac7-3aa52d7cc640",
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/6cdd148e-b931-4b7a-f983-d75d388aff00",
  userEmail: "fake@email.com",
} satisfies EmailProps;

export default TicketConfirmation;
