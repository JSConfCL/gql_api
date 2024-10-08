import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Section,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

import { BebasNeueFont, RobotoFont } from "./fonts";

export const TicketTemplate9punto5 = ({
  children,
}: React.PropsWithChildren) => {
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
              primary: "#2754C5",
              secondary: "#4F46E5",
              success: "#198754",
              danger: "#DC3545",
              warning: "#FFC107",
              info: "#0DCAF0",
              light: "#ebedf0",
              dark: "#0c0a09",
              muted: "#909090",
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
        <Body className="font-sans">
          <Container className="bg-white px-8">
            <Section className="text-sm font-light font-sans">
              <Img
                className="p-4 w-[140px] h-[80px] mx-auto"
                src="https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/4feaf3f3-217e-4ac4-ed48-2f4f38c60600/public"
                alt="9punto5 Logo"
              />

              {children}

              <Img
                className="w-[128px] ml-auto -mt-20"
                src="https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/bf01a23a-f47b-4503-0555-cb7ac38f9500/public"
                alt="9punto5 Illustration"
              />
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};
