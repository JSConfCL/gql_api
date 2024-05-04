import {
  Body,
  Font,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

import { assetURL } from ".";

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

export const BigFooter = () => (
  <Section className="mx-auto py-4 w-full text-white">
    <div className="mb-6">
      <a href="https://communityos.io/" className="flex items-center mb-6">
        <img
          src={assetURL("/static/logos/communityos-logo-white.png")}
          className="w-52"
          alt="CommunityOS logo"
        />
      </a>
    </div>
    <div className="md:flex md:justify-between space-y-9 md:space-y-0 mb-12 md:mb-6">
      <div className="text-center text-left text-sm mb-4">
        <h2 className="">Síguenos</h2>
        <div className="flex items-center gap-4">
          <a
            href="https://twitter.com/communityos_"
            target="_blank"
            className="sm:!ml-0 text-white"
          >
            <img
              src={assetURL("/static/icons/twitter-white.png")}
              className="w-5"
              alt="CommunityOS Twitter page"
            />
          </a>
          <a
            href="https://github.com/communityos"
            target="_blank"
            className="text-white"
          >
            <img
              src={assetURL("/static/icons/github-white.png")}
              className="w-5"
              alt="CommunityOSGitHub account"
            />
          </a>
          <a
            href="https://www.instagram.com/communityos.io"
            target="_blank"
            className="text-white"
          >
            <img
              src={assetURL("/static/icons/instagram-white.png")}
              className="w-5"
              alt="CommunityOSInstagram account"
            />
          </a>
        </div>
      </div>
      <div className="text-center text-right text-sm mb-4">
        <h2 className="">Contacto</h2>
        <ul className="list-none font-medium space-y-4">
          <li>
            <a
              href="mailto:contacto@communityOS.io"
              target="_blank"
              className="no-underline text-white"
            >
              contacto@communityos.io
            </a>
          </li>
        </ul>
      </div>
      <div className="text-center text-right text-sm mb-4">
        <h2 className="">Información</h2>
        <ul className="list-none font-medium space-y-4">
          <li>
            <a
              href="https://github.com/CommunityOS/code_of_conduct/blob/main/terminos_de_servicio/README.md"
              target="_blank"
              className="no-underline text-white"
            >
              Términos y Condiciones
            </a>
          </li>
          <li>
            <a
              href="https://github.com/CommunityOS/code_of_conduct/blob/main/politica_de_privacidad/README.md"
              target="_blank"
              className="no-underline text-white"
            >
              Política de Privacidad
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div>
      <span className="text-sm block  font-medium text-center">
        © 2024 Proudly Powered by CommunityOS
      </span>
    </div>
  </Section>
);
