import {
  Button,
  Container,
  Hr,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import { BigFooter, TicketTemplate } from "emails/helpers/tickets";

interface Props {
  name?: string | null;
}

export const AIHackathonPostulationWithoutTeamEmail = ({ name }: Props) => {
  return (
    <TicketTemplate>
      <Container className="bg-dark px-10 py-10 w-full max-w-2xl">
        <Section className="text-light">
          <Preview>
            ¡Bienvenido a la AI Hackathon! Encuentra tu equipo y prepárate para
            postular.
          </Preview>
          <Text className="text-4xl mb-8 text-center">AI Hackathon</Text>
          {name && <Text className="text-xl mb-4">¡Hola {name}!</Text>}
          <Text className="text-xl mb-8">
            Hemos recibido tu registro para la primera hackathon de OpenAI en
            Latinoamérica. Estamos emocionados de tenerte con nosotros.
          </Text>
          <Text className="text-xl mb-8">
            Para ayudarte a encontrar un equipo y postular, te hemos dado acceso
            a un documento de Google Sheets en el que podrás encontrar a otros
            participantes.
          </Text>
          <Text className="text-xl mb-8 text-center">
            <Button
              href="https://docs.google.com/spreadsheets/d/1ho8G2JQSemzz-tfYnCt0T3G7UyT85_5bvwSWYuZMzXo/edit?usp=sharing"
              className="bg-blue-800 text-sm py-4 px-6 rounded-md text-gray-200 self-center"
              target="_blank"
            >
              Encuentra tu Equipo Aquí
            </Button>
          </Text>
          <Text className="text-xl mb-8">
            Recuerda que tu equipo debe tener entre 2 y 5 integrantes.
          </Text>

          <Text className="text-xl mb-8 font-bold">PASOS IMPORTANTES:</Text>
          <Text className="text-xl mb-4">
            1. Encuentra tu equipo en el documento de Google Sheets.
          </Text>
          <Text className="text-xl mb-4">
            2. Una vez formado tu equipo, realiza la postulación oficial aquí:
          </Text>
          <Text className="text-xl mb-8 text-center">
            <Button
              href="https://communityos.io/ai-hackathon/postular/"
              className="bg-blue-800 text-sm py-4 px-6 rounded-md text-gray-200 self-center"
              target="_blank"
            >
              Postula con tu Equipo
            </Button>
          </Text>

          <Text className="text-xl mb-8 font-bold">
            FECHA LÍMITE DE POSTULACIÓN:
          </Text>
          <Text className="text-xl mb-8">
            Las postulaciones estarán abiertas desde el lunes 8 hasta el domingo
            21 de julio a las 23:59:59 hora de Santiago de Chile (GMT-4). ¡No lo
            olvides!
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

export default AIHackathonPostulationWithoutTeamEmail;
