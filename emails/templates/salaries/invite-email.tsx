import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Hr,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface WorkEmailValidationEmailProps {
  baseUrl: string;
  userId: string;
  code: string;
}

export const WorkEmailValidationEmail = ({
  baseUrl,
  code,
  userId,
}: WorkEmailValidationEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu código de validacion</Preview>
    <Body style={mainStyles}>
      <Container style={containerStyles}>
        <Heading style={h1Styles}>Hey!</Heading>
        <Text style={{ ...textStyles, marginBottom: "14px" }}>
          Este es tu código de validacion
        </Text>
        <Link
          href={
            "https://" + baseUrl + "/email_validation/" + userId + "/" + code
          }
          target="_blank"
          style={{
            ...linkStyles,
            display: "block",
            marginBottom: "16px",
          }}
        >
          Haz click aquí para validar tu correo
        </Link>
        <Text style={{ ...textStyles, marginBottom: "14px" }}>
          O copia y pega el siguiente código en tu perfil.
        </Text>
        <code style={codeStyles}>{code}</code>
        <Text
          style={{
            ...textStyles,
            color: "#ababab",
            marginTop: "14px",
            marginBottom: "16px",
          }}
        >
          Si no intentaste iniciar sesión en la plataforma, puedes ignorar este
          correo.
        </Text>
        <br />
        <br />
        <Text style={footerStyles}>
          With ❤️, from the{" "}
          <Link
            // href="https://WorkEmailValidation
            target="_blank"
            style={{ ...linkStyles, color: "#898989" }}
          >
            Javascript Chile
          </Link>{" "}
          team
          <Hr />
          <br />
          <Link
            href="mailto:contacto@jschile.org"
            target="_blank"
            style={{ ...linkStyles, marginTop: "16px", color: "#898989" }}
          >
            contacto@jschile.org
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WorkEmailValidationEmail;

const mainStyles = {
  backgroundColor: "#ffffff",
};

const containerStyles = {
  paddingLeft: "12px",
  paddingRight: "12px",
  margin: "0 auto",
};

const h1Styles = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
};

const linkStyles = {
  color: "#2754C5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  textDecoration: "underline",
};

const textStyles = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  margin: "24px 0",
};

const footerStyles = {
  color: "#898989",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "12px",
  lineHeight: "22px",
  marginTop: "12px",
  marginBottom: "24px",
};

const codeStyles = {
  display: "inline-block",
  padding: "16px 4.5%",
  width: "90.5%",
  backgroundColor: "#f4f4f4",
  borderRadius: "5px",
  border: "1px solid #eee",
  color: "#333",
};
