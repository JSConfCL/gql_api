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
import { BigFooter, Footer, TicketTemplate } from "emails/helpers/tickets";

interface AddedToWaitlist {
  nombre?: string | null;
}

export const IACampWaitlist = ({ nombre }: AddedToWaitlist) => {
  return (
    <TicketTemplate>
      <Container className="px-4 py-10">
        <Section className="text-light">
          <Preview>Estás en la lista de espera para IA Camp</Preview>
          <Row className="h-20 mb-14">
            <Column>
              <Img
                alt="JSConf Chile 2024"
                src={assetURL("/static/logos/iacamp-logo.png")}
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
          {/* <Row className="h-20 py-2">
            <Column className="w-12">
              <Img
                alt="JSConf Chile 2024"
                src={assetURL("/static/icons/location-white.png")}
                className="w-12 h-12"
              />
            </Column>
            <Column className="pl-4">
              {place.name && (
                <Text className="text-lg py-0 my-0">{place.name}</Text>
              )}
              {place.address && (
                <Text className="text-md py-0 my-0">{place.address}</Text>
              )}
              {online?.name && online?.url && (
                <Link href={online.url} className="text-md py-0 my-0">
                  {online.name}
                </Link>
              )}
            </Column>
          </Row> */}
        </Section>
        <Hr className="my-8" />
        {/* <Section>
          <Text>
            Este evento es parte de <strong>{community.name}</strong>.{" "}
            {community.communityURL && (
              <>
                Conoce más en{" "}
                <Link href={community.communityURL}>
                  {community.communityURL}
                </Link>
              </>
            )}
          </Text>
        </Section> */}
        <BigFooter />
      </Container>
    </TicketTemplate>
  );
};

export default IACampWaitlist;
