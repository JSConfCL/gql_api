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

import {
  BigFooterJSConfCL,
  JSConfCLTicketTemplate,
} from "emails/templates/helpers/jsconf";

interface EmailProps {
  eventName: string;
  userID: string;
  userName?: string;
  eventLogoCloudflareImageURL: string;
  userEmail: string;
}

export const JSConfCLTicketConfirmation = ({
  eventName,
  userID,
  userName,
  userEmail,
  eventLogoCloudflareImageURL,
}: EmailProps) => {
  return (
    <JSConfCLTicketTemplate>
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

          <Text className="text-xl mb-8">Estas listo para participar de:</Text>

          <Text className="text-2xl font-bold text-center mb-8 px-8 text-gray-200">
            {eventName}
          </Text>

          <Text className="text-xl mb-8">
            Este es tu id de acceso para la conferencia.
          </Text>

          <Container className="px-32 mb-12">
            <Img
              className="w-full mx-auto"
              src={`https://svg-renderer.communityos.io/qr/png/${userID}`}
            />
          </Container>

          <Text className="text-xl mb-16">
            Recuerda llevar este código contigo el día de la conferencia. Puedes
            ver los códigos de tus tickets en tu perfil de CommunityOS. Ingresa
            con tu correo <span className="font-semibold">{userEmail}</span>, en{" "}
            <Link href="https://tickets.communityos.io/my-events">
              tickets.communityos.io/my-events
            </Link>
            .
          </Text>

          <Text className="text-xl mb-4">Nos vemos en la conferencia!</Text>
          <Text className="text-xl font-semibold mb-4">
            Equipo JSConf Chile
          </Text>

          <Text className="text-xl mb-8"></Text>
        </Section>
        <Hr className="my-8 border-black" />
        <BigFooterJSConfCL theme="dark" />
      </Container>
    </JSConfCLTicketTemplate>
  );
};

JSConfCLTicketConfirmation.PreviewProps = {
  eventName: "JSConf Chile 2024",
  userName: "John Doe",
  userID: "c7fa5dc0-ffa2-4369-bac7-3aa52d7cc640",
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/7b1c5de6-bd8e-47e2-9fd0-43ce2efc3700",
  userEmail: "fake@email.com",
} satisfies EmailProps;

export default JSConfCLTicketConfirmation;
