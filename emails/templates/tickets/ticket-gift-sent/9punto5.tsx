import { Text } from "@react-email/components";
import { format, setDefaultOptions } from "date-fns";
import { es } from "date-fns/locale";
import * as React from "react";

import { TicketTemplate9punto5 } from "emails/templates/helpers/9punto5";

setDefaultOptions({ locale: es });

type Props = {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  ticketType: "CONFERENCE" | "EXPERIENCE";
  giftMessage?: string | null;
  expirationDate: Date;
};

export const TicketGiftSent9punto5 = ({
  recipientName = "Juan",
  recipientEmail = "pedro@example.com",
  senderName = "Pedro",
  ticketType = "CONFERENCE",
  giftMessage = "Mensaje de regalo",
  expirationDate,
}: Props) => {
  return (
    <TicketTemplate9punto5>
      <Text>¡Hola {senderName}!</Text>

      <Text>
        Tu regalo de entrada para {recipientName} ({recipientEmail}) ha sido
        enviado con éxito. Aquí están los detalles:
      </Text>

      <Text className="font-bold">
        {ticketType === "CONFERENCE" ? "CONFERENCIA" : "EXPERIENCIA"} 9.5
      </Text>

      {giftMessage && (
        <Text className="italic bg-light p-4 rounded">
          Tu mensaje de regalo: "{giftMessage}"
        </Text>
      )}

      <Text>
        Hemos notificado a {recipientName} sobre este regalo y le hemos
        proporcionado un enlace para confirmar su asistencia ingresando a{" "}
        https://9punto5.cl
      </Text>

      <Text>
        {recipientName} tendrá hasta el{" "}
        <strong>{format(expirationDate, "dd 'de' MMMM 'a las' HH:mm")}</strong>{" "}
        para aceptar el regalo.
      </Text>

      <Text className="text-base">¡Gracias por tu generoso regalo!</Text>

      <Text className="text-base font-bold">Equipo 9punto5</Text>
    </TicketTemplate9punto5>
  );
};

export default TicketGiftSent9punto5;
