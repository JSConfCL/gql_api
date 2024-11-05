import { Text } from "@react-email/components";
import * as React from "react";

import { TicketTemplate9punto5 } from "emails/templates/helpers/9punto5";
import { formatPrice } from "emails/templates/helpers/format-price";

type Props = {
  currencyCode: string;
  total: number;
  type: "CONFERENCE" | "EXPERIENCE";
};

export const PurchaseOrderSuccessful9punto5 = ({
  currencyCode = "USD",
  total = 0,
  type = "EXPERIENCE",
}: Props) => {
  return (
    <TicketTemplate9punto5>
      <Text>¡Hola!</Text>

      <Text>Confirmamos la compra de tu entrada:</Text>

      <Text className="font-bold">
        {type === "CONFERENCE" ? "CONFERENCIA" : "EXPERIENCIA"} 9.5 |{" "}
        {currencyCode} $
        {formatPrice(total, { mode: currencyCode as "CLP" | "USD" })}
      </Text>

      {type === "EXPERIENCE" && (
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

      <Text>Puedes ver tu entrada y novedades ingresando a tu perfil:</Text>

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
              href="https://9punto5.cl/mi-perfil"
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
              IR A MI PERFIL
            </a>
          </td>
        </tr>
      </table>

      <Text className="text-base">Nos vemos en Valdivia,</Text>

      <Text className="text-base font-bold">Equipo 9punto5</Text>
    </TicketTemplate9punto5>
  );
};

export default PurchaseOrderSuccessful9punto5;
