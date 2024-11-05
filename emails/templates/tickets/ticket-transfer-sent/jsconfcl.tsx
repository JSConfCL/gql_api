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
  recipientName: string | null;
  recipientEmail: string;
  senderName: string;
  transferMessage?: string | null;
  expirationDate: Date;
}

export const JSConfCLTicketStartTransfer = ({
  eventName,
  eventLogoCloudflareImageURL,
  recipientName,
  recipientEmail,
  senderName,
  transferMessage,
  expirationDate,
}: EmailProps) => {
  return (
    <JSConfCLTicketTemplate>
      <Container className="px-10 py-10 w-full max-w-3xl font-light">
        <Section className="">
          <Preview>
            Ticket para {eventName} envíado
            {recipientName ? ` a ${recipientName}` : ""}
          </Preview>
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
            {senderName ? `Hola ${senderName},` : "Hola,"}
          </Text>

          <Text className="text-xl mb-8">
            Tu entrada para {recipientName} ({recipientEmail}) ha sido enviada
            con éxito. Aquí están los detalles:
          </Text>

          {transferMessage && (
            <Text className="italic text-xl p-4 rounded">
              Tu mensaje de regalo: "{transferMessage}"
            </Text>
          )}

          <Text className="text-xl mb-8">
            Hemos notificado a {recipientName} y le hemos proporcionado
            información adicional para continuar y para confirmar su asistencia
            ingresando a{" "}
            <Link href="https://tickets.communityos.io/my-events">
              tickets.communityos.io/my-events
            </Link>
          </Text>

          <Text className="text-xl mb-8">
            {recipientName} tendrá hasta el{" "}
            <strong>
              {format(expirationDate, "dd 'de' MMMM 'a las' HH:mm")} hs
            </strong>{" "}
            para aceptar la invitación.
          </Text>

          <Text className="text-xl mb-16">
            Para ver o gestionar tus transferencias puedes ir a{" "}
            <Link href="https://tickets.communityos.io/my-transfers">
              tickets.communityos.io/my-transfers
            </Link>{" "}
            .
          </Text>

          <Text className="text-xl mb-4">
            Si tienes alguna pregunta, no dudes en contactarnos.
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

JSConfCLTicketStartTransfer.PreviewProps = {
  eventName: "JSConf Chile 2024",
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/7b1c5de6-bd8e-47e2-9fd0-43ce2efc3700",
  recipientName: "John Doe",
  recipientEmail: "john@fakeemail.com",
  senderName: "Richard Roe",
  transferMessage: "Start Transfer",
  expirationDate: add(new Date(), { weeks: 1 }),
} satisfies EmailProps;

export default JSConfCLTicketStartTransfer;
