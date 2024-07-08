import { Container, Hr, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

import { BigFooter, TicketTemplate } from "emails/helpers/tickets";

interface Props {
  name?: string | null;
}

export const AIHackathonPostulationWithTeamEmail = ({ name }: Props) => {
  return (
    <TicketTemplate>
      <Container className="bg-dark px-10 py-10 w-full max-w-2xl">
        <Section className="text-light">
          <Preview>
            ¡Tu equipo está listo para la AI Hackathon! Prepárate para innovar.
          </Preview>

          <Text className="text-4xl mb-8 text-center">AI Hackathon</Text>

          {name && <Text className="text-xl mb-4">¡Hola {name}!</Text>}

          <Text className="text-xl mb-8">
            Hemos recibido tu postulación para participar en la primera
            hackathon de OpenAI en Latinoamérica. ¡Estamos emocionados de
            tenerte con nosotros!
          </Text>

          <Text className="text-xl mb-8">
            Tu equipo está oficialmente registrado para este emocionante
            desafío. Aquí tienes algunos puntos importantes a tener en cuenta.
          </Text>

          <Text className="text-xl mb-8 font-bold">PRÓXIMOS PASOS:</Text>
          <Text className="text-xl mb-4">
            1. Estaremos revisando todas las postulaciones cuidadosamente.
          </Text>
          <Text className="text-xl mb-4">
            2. Te contactaremos el Martes 30 de Julio con los resultados de la
            selección.
          </Text>

          <Text className="text-xl mb-8">
            ¡Éxitos en la postulación!
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

export default AIHackathonPostulationWithTeamEmail;
