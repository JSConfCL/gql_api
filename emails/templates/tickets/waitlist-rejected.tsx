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

export const WaitlistAccepted = ({
  eventName,
  userName,
  eventLogoCloudflareImageURL,
}: EmailProps) => {
  return (
    <TicketTemplate theme="light">
      <Container className="px-10 py-10 w-full max-w-2xl">
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

          <Text className="text-xl mb-2">
            Queremos agradecerte por haber mostrado interés en asistir a:
          </Text>
          <Text className="text-xl text-center mb-8 px-4 text-gray-400">
            {eventName}
          </Text>
          <Text className="text-xl mb-2">
            Lamentablemente, debido a la alta demanda y al espacio limitado, no
            pudimos acomodarte en esta ocasión.
          </Text>

          <Text className="text-xl mb-8">
            Nos encantaría que nos acompañes en nuestros futuros eventos, así
            que te mantendremos informado de próximas oportunidades.
          </Text>

          <Text className="text-xl mb-8">
            Puedes seguirnos en nuestras rédes sociales para estar al tanto de
            todas nuestras novedades y eventos.
          </Text>

          <Text className="text-xl">
            <br /> Equipo CommunityOS
          </Text>
          <Text className="text-xl mb-8"></Text>
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
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/6cdd148e-b931-4b7a-f983-d75d388aff00",
} satisfies EmailProps;

export default WaitlistAccepted;
