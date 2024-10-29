import { Text } from "@react-email/components";
import { format, setDefaultOptions } from "date-fns";
import { es } from "date-fns/locale";
import * as React from "react";

import { TicketTemplate9punto5 } from "emails/templates/helpers/9punto5";

setDefaultOptions({ locale: es });

type Props = {
  transferId: string;
  recipientName: string;
  senderName: string;
  ticketType: "CONFERENCE" | "EXPERIENCE";
  transferMessage?: string | null;
  expirationDate: Date;
};

export const TicketTransferReceived9punto5 = ({
  transferId,
  recipientName = "Juan",
  senderName = "Pedro",
  ticketType = "CONFERENCE",
  transferMessage = "Mensaje de regalo",
  expirationDate,
}: Props) => {
  return (
    <TicketTemplate9punto5>
      <Text>¡Hola {recipientName}!</Text>

      <Text>
        Tenemos una gran noticia para ti. <strong>{senderName}</strong> te ha
        enviado una entrada para:
      </Text>

      <Text className="font-bold">
        {ticketType === "CONFERENCE" ? "CONFERENCIA" : "EXPERIENCIA"} 9.5
      </Text>

      {transferMessage && (
        <Text className="italic bg-light p-4 rounded">"{transferMessage}"</Text>
      )}

      {ticketType === "EXPERIENCE" && (
        <>
          <Text className="font-normal my-0">GREEN CARPET - 7 NOV</Text>
          <Text className="font-normal my-0">20:00 HORAS</Text>
          <Text className="mt-0">
            Evento estelar de bienvenida. Cocktail para compartir con la
            comunidad y speakers.
          </Text>

          <Text className="font-normal my-0">ACCESO A TALLERES - 7 NOV</Text>
          <Text className="font-normal my-0">14:30 y 16:30 HORAS</Text>
          <Text className="mt-0">
            Podrás participar en dos talleres que serán a las 14:30 y 16:30
            horas. Cupos limitados.
          </Text>
        </>
      )}

      <Text className="font-normal my-0">CONFERENCIA - 8 y 9 NOV</Text>
      <Text className="font-normal my-0">9:30 – 18:00 HORAS</Text>
      <Text className="mt-0">
        Más de 40 charlas para elegir y 3 auditorios en paralelo.
      </Text>

      <Text>Incluye kit de bienvenida 2024 y coffee breaks.</Text>

      <Text className="mb-0">Además, pronto podrás agregar:</Text>
      <ul className="list-disc pl-5 ml-0">
        <li>Almuerzo para los 3 días</li>
      </ul>

      <Text>
        Para confirmar tu asistencia y ver los detalles de tu entrada, por favor
        ingresa a tu perfil:
      </Text>

      <table
        border={0}
        cellPadding="0"
        cellSpacing="0"
        role="presentation"
        style={{ margin: "48px auto" }}
      >
        <tr>
          <td align="center" role="presentation">
            <a
              href={`https://9punto5.cl/mi-perfil?action=${encodeURIComponent(
                "accept-transfer",
              )}&transferId=${encodeURIComponent(transferId)}`}
              target="_blank"
              style={{
                color: "#ffffff",
                fontFamily: '"Bebas Neue", Arial, sans-serif',
                fontSize: "18px",
                fontWeight: "normal",
                lineHeight: "120%",
                textDecoration: "none",
                textTransform: "uppercase",
                display: "inline-block",
                borderRadius: "8px",
                backgroundColor: "#192927",
                padding: "10px 20px",
              }}
            >
              ACEPTAR ENTRADA
            </a>
          </td>
        </tr>
      </table>

      <Text className="text-sm">
        Importante: Tienes hasta el{" "}
        <strong>
          {format(expirationDate, "dd 'de' MMMM 'a las' HH:mm")} hs
        </strong>{" "}
        para aceptar la entrada.
      </Text>

      <Text className="text-base">¡Nos vemos en Valdivia!</Text>

      <Text className="text-base font-bold">Equipo 9punto5</Text>
    </TicketTemplate9punto5>
  );
};

export default TicketTransferReceived9punto5;
