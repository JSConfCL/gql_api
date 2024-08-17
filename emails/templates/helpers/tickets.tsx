import {
  Body,
  Column,
  Head,
  Html,
  Row,
  Tailwind,
} from "@react-email/components";
import classNames from "classnames";
import * as React from "react";

import { PoppinsFont, RobotoFont } from "emails/templates/helpers/fonts";

type ThemeType = { theme: "dark" | "light" };

interface WorkEmailValidationEmailProps {
  children: React.ReactNode;
  preview?: string | string[];
  font?: "poppins" | "roboto";
}

export const TicketTemplate = ({
  children,
  theme,
  font = "poppins",
}: WorkEmailValidationEmailProps & ThemeType) => {
  return (
    <Tailwind
      config={{
        theme: {
          fontFamily: {
            sans: [
              font === "poppins" ? "Poppins" : "Roboto",
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
      <Html
        className={classNames({
          "bg-dark text-white": theme === "dark",
          "bg-light text-black": theme === "light",
        })}
        lang="es"
      >
        <Head>
          {font === "poppins" && <PoppinsFont />}
          {font === "roboto" && <RobotoFont />}
        </Head>
        <Body className="font-sans">{children}</Body>
      </Html>
    </Tailwind>
  );
};

export const Footer = ({ theme }: ThemeType) => (
  <section
    className={classNames({
      "bg-dark text-white p-4": theme === "dark",
      "bg-light text-black p-4": theme === "light",
    })}
  >
    <p className="text-center text-sm text-muted">
      <Row>
        <span className="text-sm block  font-medium text-center">
          © {new Date().getFullYear()} Proudly Powered by CommunityOS
        </span>
      </Row>
    </p>
  </section>
);

export const BigFooter = ({ theme }: ThemeType) => {
  const textStyle = theme === "dark" ? "text-white" : "text-black";

  return (
    <Row className={classNames("mx-auto py-4 w-full", textStyle)}>
      <Row>
        <a href="https://communityos.io/" className="flex items-center">
          <img
            src={
              theme === "dark"
                ? "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/c156c63f-88e4-426e-82ef-71fa1effeb00/w=200,fit=scale-down"
                : "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/4289edf1-397f-48d2-7c83-da2494513900/w=200,fit=scale-down"
            }
            className="w-52"
            alt="CommunityOS logo"
          />
        </a>
      </Row>
      <Row className="py-10">
        <Column className={"align-top"}>
          <div className="text-center text-left text-sm mb-4">
            <div className={classNames("mb-4", textStyle)}>Síguenos</div>
            <div className="flex items-center">
              <a
                href="https://twitter.com/communityos_"
                target="_blank"
                className={textStyle}
              >
                <img
                  src={
                    theme === "dark"
                      ? "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/25d9c84d-db72-4540-4f87-158211e5c700/default"
                      : "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/a5ad6b7f-2abb-48cb-0b49-b9f1b9cda800/default"
                  }
                  className="w-5"
                  alt="CommunityOS Twitter page"
                />
              </a>
              <a
                href="https://github.com/communityos"
                target="_blank"
                className="text-white px-4"
              >
                <img
                  src={
                    theme === "dark"
                      ? "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/33740022-79bd-4f38-6da8-263eef123700/default"
                      : "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/affbe681-fa1e-477e-dfed-300be394f600/default"
                  }
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
                  src={
                    theme === "dark"
                      ? "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/c897ce51-d9a4-4d5b-bd4c-fecae08fc300/default"
                      : "https://imagedelivery.net/dqFoxiedZNoncKJ9uqxz0g/29647134-ddd1-4d00-b565-5fb78e8fcb00/default"
                  }
                  className="w-5"
                  alt="CommunityOSInstagram account"
                />
              </a>
            </div>
          </div>
        </Column>
        <Column className="align-top">
          <div className="text-right text-sm mb-4">
            <div className="">Contacto</div>
            <ul className="list-none font-medium space-y-4">
              <li>
                <a
                  href="mailto:contacto@communityOS.io"
                  target="_blank"
                  className={classNames("no-underline", textStyle)}
                >
                  contacto@communityos.io
                </a>
              </li>
            </ul>
          </div>
        </Column>
        <Column className="align-top">
          <div className="text-right text-sm mb-4">
            <div className="">Información</div>
            <ul className="list-none font-medium space-y-4">
              <li>
                <a
                  href="https://legal.communityos.io/terminos_de_servicio"
                  target="_blank"
                  className={classNames("no-underline", textStyle)}
                >
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a
                  href="https://legal.communityos.io/politica_de_privacidad"
                  target="_blank"
                  className={classNames("no-underline", textStyle)}
                >
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>
        </Column>
      </Row>
      <Row>
        <span className="text-sm block  font-medium text-center">
          © {new Date().getFullYear()} Proudly Powered by CommunityOS
        </span>
      </Row>
    </Row>
  );
};
