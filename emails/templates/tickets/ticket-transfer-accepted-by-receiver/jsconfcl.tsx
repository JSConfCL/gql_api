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

type Props = {
  eventName: string;
  eventLogoCloudflareImageURL?: string;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
};

export const JSConfCLAcceptedTicketTransfer = ({
  eventName,
  eventLogoCloudflareImageURL,
  recipientName,
  recipientEmail,
  senderName,
}: Props) => {
  return (
    <JSConfCLTicketTemplate>
      <Container className="px-10 py-10 w-full max-w-3xl font-light">
        <Preview>Tu ticket para {eventName}</Preview>
        {eventLogoCloudflareImageURL && (
          <Row className="h-20 mb-14">
            <Column>
              <Img
                src={`${eventLogoCloudflareImageURL}/w=300,fit=scale-down`}
                className="w-full max-w-[200px]"
              />
            </Column>
          </Row>
        )}
        <Section className="">
          <Text className="text-2xl mb-6">
            {senderName ? `Hola ${senderName},` : "Hola,"}
          </Text>

          <Text className="text-xl mb-8">
            ¡Buenas noticias! {recipientName} ({recipientEmail}) ha aceptado tu
            entrada para:
          </Text>

          <Text className="text-2xl font-bold text-center mb-8 px-8 text-gray-200">
            {eventName}
          </Text>

          <Text className="text-xl mb-8">
            {recipientName} ha confirmado su asistencia y ahora está
            oficialmente registrado para el evento.
          </Text>

          <Text className="text-xl mb-8">
            Ahora {recipientName} podrá disfrutar de esta increíble experiencia.
            Tu apoyo ayuda a fortalecer nuestra comunidad y hacer posible este
            evento.
          </Text>

          <Text className="text-xl mb-16">
            Para ver o gestionar tus transferencias puedes ir a{" "}
            <Link href="https://tickets.communityos.io/my-transfers">
              tickets.communityos.io/my-transfers
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

JSConfCLAcceptedTicketTransfer.PreviewProps = {
  eventName: "JSConf Chile 2024",
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/7b1c5de6-bd8e-47e2-9fd0-43ce2efc3700",
  recipientName: "John Doe",
  recipientEmail: "fake@email.com",
  senderName: "Jane Doe",
} satisfies Props;

export default JSConfCLAcceptedTicketTransfer;
