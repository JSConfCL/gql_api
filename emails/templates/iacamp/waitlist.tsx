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

interface AddedToWaitlist {
  nombre?: string | null;
}

export const IACampWaitlist = ({ nombre }: AddedToWaitlist) => {
  return (
    <TicketTemplate>
      <Container className="bg-dark px-10 py-10 w-full max-w-2xl">
        <Section className="text-light">
          <Preview>Estás en la lista de espera para IA Camp</Preview>
          <Row className="h-20 mb-14">
            <Column>
              <Img
                alt="IA Camp 2024 - With CommunityOS and OpenAI"
                src={assetURL(
                  "/static/logos/iacamp-logo-with-communityos-and-openai.png",
                )}
                className="w-full max-w-[300px] mx-auto"
              />
            </Column>
          </Row>
          <Text className="text-4xl text-center mb-8">
            Estás en la lista de espera para <br /> <strong>IA Camp</strong>!
          </Text>
          {nombre && <Text className="text-xl mb-4">Hey {nombre}!</Text>}
          <Text className="text-xl mb-8">
            Ya estás oficialmente en la lista de espera para{" "}
            <strong>IA Camp</strong>, que se celebrará próximamente en Santiago,
            Chile.
          </Text>
          <Text className="text-xl mb-8">
            Nos aseguraremos de informarte sobre todos los detalles importantes,
            como las fechas y próximos pasos para que junto a un equipo, o solo,
            maximises tus posibilidades de participar en la{" "}
            <strong>
              primera hackathon de OpenAI en Chile y Latinoamérica.
            </strong>
          </Text>
          <Text className="text-xl mb-8">
            El evento se llevará a cabo durante todo un fin de semana, donde
            tendrás oportunidad única para colaborar en equipos
            multidisciplinarios y trabajar con los modelos de inteligencia
            artificial más avanzados del mundo, desarrollando prototipos que nos
            ayuden a construir un futuro más sostenible
          </Text>
        </Section>
        <Hr className="my-8" />
        <BigFooter />
      </Container>
    </TicketTemplate>
  );
};

export default IACampWaitlist;
