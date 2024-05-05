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

import { assetURL } from "emails/helpers";
import { BigFooter, TicketTemplate } from "emails/helpers/tickets";

export const SponsorsConfirmation = () => {
  return (
    <TicketTemplate>
      <Container className="bg-dark px-10 py-10 w-full max-w-2xl">
        <Section className="text-light">
          <Preview>Gracias por tu interés en auspiciar IA Camp.</Preview>
          <Row className="h-20 mb-14">
            <Column>
              <Img
                alt="JSConf Chile 2024"
                src={assetURL("/static/logos/iacamp-logo.png")}
                className="w-full max-w-[100px]"
              />
            </Column>
          </Row>
          <Text className="text-xl mb-8">Hola,</Text>
          <Text className="text-xl mb-8">
            Gracias por tu interés en auspiciar IA Camp.
          </Text>
          <Text className="text-xl mb-8">
            Si bien revisamos cada solicitud, debido al alto volumen que hemos
            recibido, podríamos tardar un poco más en responderte. Apreciamos tu
            paciencia y comprensión.
          </Text>
          <Text className="text-xl mb-8">
            Mientras tanto, si tienes alguna pregunta, no dudes en enviarnos un
            correo, y te responderemos lo antes posible.
          </Text>
          <Text className="text-xl mb-8">
            Gracias por tu interés en ser parte de <strong>IACamp</strong>.
          </Text>
        </Section>
        <Hr className="my-4" />
        <BigFooter />
      </Container>
    </TicketTemplate>
  );
};

export default SponsorsConfirmation;
