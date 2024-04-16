import {
  Column,
  Container,
  Hr,
  Link,
  Row,
  Section,
  Text,
  Img,
  Button,
} from "@react-email/components";
import { formatDate } from "date-fns";
import { es } from "date-fns/locale";
import * as React from "react";

import { assetURL } from "emails/helpers";
import { Footer, TicketTemplate } from "emails/helpers/tickets";

type WorkEmailValidationEmailProps = {
  purchaseOrderId: string;
  eventName: string;
  community: {
    name: string;
    communityURL?: string | null;
    logoURL?: string | null;
  };
  date: {
    start: Date;
    end?: Date | null;
  };
  place: {
    name: string | null;
    address: string | null;
  };
  online?: {
    url: string;
    name: string;
  };
};

export const PurchaseOrderSuccessful = ({
  purchaseOrderId,
  community = {
    name: "Javascript Chile",
    communityURL: "https://cdn.com",
    logoURL: assetURL("/static/images/jschile-logo.png"),
  },
  eventName = "JSConf Chile 2024",
  // userName = "fforres",
  place = {
    name: "Centro de Eventos Espacio Riesco",
    address: "Av. El Salto 5000, Huechuraba, Santiago",
  },
  date = {
    start: new Date(),
    end: new Date(),
  },
  online = {
    url: "https://cdn.com",
    name: "Twitch.com",
  },
}: WorkEmailValidationEmailProps) => {
  const parsedDate = formatDate(date.start, "dd MMMM',' yyyy", {
    locale: es,
  });
  const parsedTime = formatDate(date.start, "HH:mm", {
    locale: es,
  });
  const parsedEndDate = date.end
    ? formatDate(date.end, "dd MMMM ',' yyyy", {
        locale: es,
      })
    : null;
  const parsedEndTime = date.end
    ? formatDate(date.end, "HH:mm", {
        locale: es,
      })
    : null;
  return (
    <TicketTemplate>
      <Container>
        <Section>
          <Text className="text-xl text-muted">
            Tus tickets están listos para:
          </Text>
          <Text className="text-3xl font-bold">{eventName}</Text>
        </Section>
        <Hr className="my-6" />
        <Section>
          <Row className="h-20">
            <Column className="w-12">
              <Img
                alt="JSConf Chile 2024"
                src={assetURL("/static/icons/calendar-white.png")}
                className="w-12 h-12"
              />
            </Column>
            <Column className="pl-4">
              <Text className="text-xl py-0 my-0">
                {parsedDate} a las {parsedTime}
              </Text>
              <Text className="text-md py-0 my-0">
                {parsedEndDate
                  ? `Hasta el ${parsedEndDate} ${
                      parsedEndTime ? `a las ${parsedEndTime}` : ""
                    }`
                  : ""}
              </Text>
            </Column>
          </Row>
          <Row className="h-20 py-2">
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
          </Row>
        </Section>
        <Hr className="my-8" />
        <Section className="py-4">
          <Button
            href="https://cdn.com"
            className="bg-purple-500 py-4 px-6 rounded-md text-white mr-4"
            target="_blank"
          >
            Ver Evento
          </Button>
          <Button
            href="https://cdn.com"
            className="bg-gray-200 py-4 px-6 rounded-md text-gray-600"
            target="_blank"
          >
            Ver Tickets
          </Button>
        </Section>
        <Section>
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
        </Section>
        <Footer />
      </Container>
    </TicketTemplate>
  );
};

export default PurchaseOrderSuccessful;
