import {
  Body,
  Font,
  Head,
  Html,
  Link,
  Preview,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface WorkEmailValidationEmailProps {
  children: React.ReactNode;
  preview?: string | string[];
}

export const TicketTemplate = ({
  preview,
  children,
}: WorkEmailValidationEmailProps) => (
  <Tailwind
    config={{
      theme: {
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
            light: "#F8F9FA",
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
    <Html className="bg-dark text-white" lang="es">
      <Head>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={800}
          fontStyle="bold"
        />
      </Head>
      {preview && <Preview>Tus tickets están listos</Preview>}
      <Body>{children}</Body>
    </Html>
  </Tailwind>
);

export const Footer = () => (
  <section className="bg-dark text-white p-4">
    <p className="text-center text-sm text-muted">
      Este evento está apoyado por{" "}
      <Link href="https://communityos.io">
        <strong>communityos.io</strong>
      </Link>
    </p>
  </section>
);
