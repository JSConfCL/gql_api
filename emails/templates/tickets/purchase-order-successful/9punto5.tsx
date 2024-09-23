import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

import { BebasNeueFont, RobotoFont } from "emails/templates/helpers/fonts";
import { formatPrice } from "emails/templates/helpers/format-price";

const TicketTemplate = ({ children }: React.PropsWithChildren) => {
  return (
    <Tailwind
      config={{
        theme: {
          fontFamily: {
            sans: ["Roboto", "ui-sans-serif", "system-ui", "Verdana"],
            "bebas-neue": [
              "Bebas Neue",
              "ui-sans-serif",
              "system-ui",
              "Verdana",
            ],
          },
          extend: {
            colors: {
              // Brand
              primary: "#2754C5",
              secondary: "#4F46E5",
              // Actionables
              success: "#198754",
              danger: "#DC3545",
              warning: "#FFC107",
              // Grays
              info: "#0DCAF0",
              light: "#ebedf0",
              dark: "#0c0a09",
              muted: "#909090",
              // Neutrals
              white: "#FFFFFF",
              black: "#000000",
            },
          },
        },
      }}
    >
      <Html className="bg-light" lang="es">
        <Head>
          <BebasNeueFont />
          <RobotoFont />
        </Head>
        <Body className="font-sans">{children}</Body>
      </Html>
    </Tailwind>
  );
};

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
    <TicketTemplate>
      <Container className="bg-white px-8">
        <Section className="text-sm font-light font-sans">
          <Img
            className="w-[128px] mx-auto py-8"
            src="https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/663ad351-14fc-4e40-6921-ba6b142be400/public"
            alt="9punto5 Logo"
          />

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

              <Text className="font-normal my-0">
                ACCESO A TALLERES - 7 NOV
              </Text>
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

          <Text className="mb-0">
            Además considera que pronto podrás agregar:
          </Text>
          <ul className="list-disc pl-5 ml-0">
            <li>Estadía para 3 noches en hotel Villa del Río</li>
            <li>Almuerzo para los 3 días</li>
          </ul>

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

          <Img
            className="w-[128px] ml-auto -mt-20"
            src="https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/bf01a23a-f47b-4503-0555-cb7ac38f9500/public"
            alt="9punto5 Illustration"
          />
        </Section>
      </Container>
    </TicketTemplate>
  );
};

export default PurchaseOrderSuccessful9punto5;
