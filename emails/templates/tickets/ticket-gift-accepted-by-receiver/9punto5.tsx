import { Text } from "@react-email/components";
import * as React from "react";

import { TicketTemplate9punto5 } from "emails/templates/helpers/9punto5";

type Props = {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  ticketType: "CONFERENCE" | "EXPERIENCE";
};

export const TicketGiftAcceptedByReceiver9punto5 = ({
  recipientName = "Juan",
  recipientEmail = "juan@example.com",
  senderName = "Pedro",
  ticketType = "CONFERENCE",
}: Props) => {
  return (
    <TicketTemplate9punto5>
      <Text>¡Hola {senderName}!</Text>

      <Text>
        ¡Buenas noticias! {recipientName} ({recipientEmail}) ha aceptado tu
        regalo de entrada para:
      </Text>

      <Text className="font-bold">
        {ticketType === "CONFERENCE" ? "CONFERENCIA" : "EXPERIENCIA"} 9.5
      </Text>

      <Text>
        {recipientName} ha confirmado su asistencia y ahora está oficialmente
        registrado para el evento.
      </Text>

      <Text>
        Ahora {recipientName} podrá disfrutar de esta increíble experiencia. Tu
        apoyo ayuda a fortalecer nuestra comunidad y hacer posible este evento.
      </Text>

      <Text className="text-base">¡Nos vemos en Valdivia!</Text>

      <Text className="text-base font-bold">Equipo 9punto5</Text>
    </TicketTemplate9punto5>
  );
};

export default TicketGiftAcceptedByReceiver9punto5;
