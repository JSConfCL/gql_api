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

export const WaitlistAccepted = ({
  eventName,
  userName,
  eventLogoCloudflareImageURL,
}: EmailProps) => {
  return (
    <TicketTemplate>
      <Container className="bg-dark px-10 py-10 w-full max-w-2xl">
        <Section className="text-light">
          <Preview>Gracias por tu interés en {eventName}</Preview>
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
        <Hr className="my-8" />
        <BigFooter />
      </Container>
    </TicketTemplate>
  );
};

WaitlistAccepted.PreviewProps = {
  eventName: "El Potencial Clave de la Recuperación Aumentada (RAG) con OpenAI",
  userName: "John Doe",
  eventLogoCloudflareImageURL:
    "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/b6b43de1-d360-4faf-bd7a-7421e8fc1f00",
} satisfies EmailProps;

export default WaitlistAccepted;
