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
  transferMessage?: string | null;
  expirationDate: Date;
};

export const TicketTransferSent9punto5 = ({
  recipientName = "Juan",
  recipientEmail = "pedro@example.com",
  senderName = "Pedro",
  ticketType = "CONFERENCE",
  transferMessage = "Mensaje de regalo",
  expirationDate,
}: Props) => {
  return (
    <TicketTemplate9punto5>
      <Text>¡Hola {senderName}!</Text>

      <Text>
        Tu entrada para {recipientName} ({recipientEmail}) ha sido enviada con
        éxito. Aquí están los detalles:
      </Text>

      <Text className="font-bold">
        {ticketType === "CONFERENCE" ? "CONFERENCIA" : "EXPERIENCIA"} 9.5
      </Text>

      {transferMessage && (
        <Text className="italic bg-light p-4 rounded">
          Tu mensaje de regalo: "{transferMessage}"
        </Text>
      )}

      <Text>
        Hemos notificado a {recipientName} y le hemos proporcionado un enlace
        para confirmar su asistencia ingresando a https://9punto5.cl
      </Text>

      <Text>
        {recipientName} tendrá hasta el{" "}
        <strong>
          {format(expirationDate, "dd 'de' MMMM 'a las' HH:mm")} hs
        </strong>{" "}
        para aceptar la invitación.
      </Text>

      <Text className="text-base">
        Si tienes alguna pregunta, no dudes en contactarnos.
      </Text>

      <Text className="text-base font-bold">Equipo 9punto5</Text>
    </TicketTemplate9punto5>
  );
};

export default TicketTransferSent9punto5;
