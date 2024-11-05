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
import { add, format } from "date-fns";
import * as React from "react";

import {
  BigFooterJSConfCL,
  JSConfCLTicketTemplate,
} from "emails/templates/helpers/jsconf";

interface EmailProps {
  eventName: string;
  eventLogoCloudflareImageURL?: string;
  transferId: string;
  recipientName: string;
  senderName: string;
  transferMessage?: string | null;
  expirationDate: Date;
}

export const JSConfCLTicketReceivedTransfer = ({
  eventName,
  eventLogoCloudflareImageURL,
  recipientName,
  senderName,
  transferMessage,
  expirationDate,
}: EmailProps) => {
  return (
    <JSConfCLTicketTemplate>
      <Container className="px-10 py-10 w-full max-w-3xl font-light">
        <Section className="">
          <Preview>Te han enviado un Ticket para {eventName}</Preview>
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

          <Text className="text-2xl mb-6">
            {recipientName ? `Hola ${recipientName},` : "Hola,"}
          </Text>

          <Text className="text-xl mb-6">
            Tenemos una gran noticia para ti. <strong>{senderName}</strong> te
            ha enviado una entrada para:
          </Text>

          <Text className="text-2xl font-bold text-center mb-8 px-8 text-gray-200">
            {eventName}
          </Text>

          {transferMessage && (
            <Text className="italic text-xl p-4 rounded">
              "{transferMessage}"
            </Text>
          )}

          <Text className="text-xl mb-16">
            Puedes ver y aceptar la entrada recibida fácilmente desde{" "}
            <Link href="https://tickets.communityos.io/my-events">
              tickets.communityos.io/my-events
            </Link>
            . Para ver o gestionar tus transferencias puedes ir a{" "}
            <Link href="https://tickets.communityos.io/my-transfers">
              tickets.communityos.io/my-transfers
            </Link>{" "}
            .
          </Text>

          <Text className="text-base mb-6">
            Importante: Tienes hasta el{" "}
            <strong>
              {format(expirationDate, "dd 'de' MMMM 'a las' HH:mm")} hs
            </strong>{" "}
            para aceptar la entrada.
          </Text>

          <div>-----</div>
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

JSConfCLTicketReceivedTransfer.PreviewProps = {
  eventName: "JSConf Chile 2024",
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/7b1c5de6-bd8e-47e2-9fd0-43ce2efc3700",
  transferId: "fake-transfer-id",
  recipientName: "John Doe",
  senderName: "Richard Roe",
  expirationDate: add(new Date(), { weeks: 1 }),
} satisfies EmailProps;

export default JSConfCLTicketReceivedTransfer;
