import {
  Button,
  Container,
  Hr,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import { BigFooter, TicketTemplate } from "emails/helpers/tickets";

interface AddedToWaitlist {
  nombre?: string | null;
}

export const IACampWaitlist = ({ nombre }: AddedToWaitlist) => {
  return (
    <TicketTemplate>
      <Container className="bg-dark px-10 py-10 w-full max-w-2xl">
        <Section className="text-light">
          <Preview>
            ¡Gracias por registrarte al webinar de AI Hackathon!
          </Preview>

          <Text className="text-4xl mb-8 text-center">AI Hackathon</Text>

          {nombre && <Text className="text-xl mb-4">Hey {nombre}!</Text>}

          <Text className="text-xl mb-8">
            Confirmamos tu registro al{" "}
            <Link href="https://www.youtube.com/live/RSNRrqbLR84?si=DnG257y3MyWDppbi">
              webinar
            </Link>{" "}
            que tendremos este lunes 8 de julio a las 6:00 pm hora Santiago,
            Chile (GMT-4).
          </Text>

          <Text className="text-xl mb-8">
            En esta actividad resolveremos todas tus dudas y abriremos las
            postulaciones para participar en la primera hackathon de OpenAI en
            Latinoamérica.
          </Text>

          <Text className="text-center mb-8">
            <Button
              href="https://www.youtube.com/live/RSNRrqbLR84?si=DnG257y3MyWDppbi"
              className="bg-blue-800 py-4 px-6 rounded-md text-gray-200 self-center"
              target="_blank"
            >
              Entrar al Webinar
            </Button>
          </Text>

          <Text className="text-xl mb-8">
            Agrega{" "}
            <Link href="https://www.youtube.com/live/RSNRrqbLR84?si=DnG257y3MyWDppbi">
              este evento a tu calendario
            </Link>{" "}
            para no olvidarlo.
          </Text>

          <Text className="text-xl">
            Un saludo,
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

export default IACampWaitlist;
