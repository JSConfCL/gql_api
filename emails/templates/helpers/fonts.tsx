import { Font } from "@react-email/components";
import * as React from "react";

const poppins = [
  {
    fontStyle: "italic",
    fontWeight: 100,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiAyp8kv8JHgFVrJJLmE0tMMPKhSkFEkm8.woff2",
  },
  /* latin */
  {
    fontStyle: "italic",
    fontWeight: 100,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiAyp8kv8JHgFVrJJLmE0tCMPKhSkFE.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "italic",
    fontWeight: 200,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLmv1pVGdeOYktMqlap.woff2",
  },
  /* latin */
  {
    fontStyle: "italic",
    fontWeight: 200,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLmv1pVF9eOYktMqg.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "italic",
    fontWeight: 300,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLm21lVGdeOYktMqlap.woff2",
  },
  /* latin */
  {
    fontStyle: "italic",
    fontWeight: 300,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLm21lVF9eOYktMqg.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "italic",
    fontWeight: 400,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiGyp8kv8JHgFVrJJLufntAOvWDSHFF.woff2",
  },
  /* latin */
  {
    fontStyle: "italic",
    fontWeight: 400,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiGyp8kv8JHgFVrJJLucHtAOvWDSA.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "italic",
    fontWeight: 500,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLmg1hVGdeOYktMqlap.woff2",
  },
  /* latin */
  {
    fontStyle: "italic",
    fontWeight: 500,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLmg1hVF9eOYktMqg.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "italic",
    fontWeight: 600,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLmr19VGdeOYktMqlap.woff2",
  },
  /* latin */
  {
    fontStyle: "italic",
    fontWeight: 600,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLmr19VF9eOYktMqg.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "italic",
    fontWeight: 700,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLmy15VGdeOYktMqlap.woff2",
  },
  /* latin */
  {
    fontStyle: "italic",
    fontWeight: 700,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLmy15VF9eOYktMqg.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "italic",
    fontWeight: 800,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLm111VGdeOYktMqlap.woff2",
  },
  /* latin */
  {
    fontStyle: "italic",
    fontWeight: 800,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLm111VF9eOYktMqg.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "italic",
    fontWeight: 900,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLm81xVGdeOYktMqlap.woff2",
  },
  /* latin */
  {
    fontStyle: "italic",
    fontWeight: 900,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiDyp8kv8JHgFVrJJLm81xVF9eOYktMqg.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "normal",
    fontWeight: 100,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiGyp8kv8JHgFVrLPTufntAOvWDSHFF.woff2",
  },
  /* latin */
  {
    fontStyle: "normal",
    fontWeight: 100,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiGyp8kv8JHgFVrLPTucHtAOvWDSA.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "normal",
    fontWeight: 200,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLFj_Z1JlFd2JQEl8qw.woff2",
  },
  /* latin */
  {
    fontStyle: "normal",
    fontWeight: 200,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLFj_Z1xlFd2JQEk.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "normal",
    fontWeight: 300,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLDz8Z1JlFd2JQEl8qw.woff2",
  },
  /* latin */
  {
    fontStyle: "normal",
    fontWeight: 300,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLDz8Z1xlFd2JQEk.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "normal",
    fontWeight: 400,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJnecnFHGPezSQ.woff2",
  },
  /* latin */
  {
    fontStyle: "normal",
    fontWeight: 400,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "normal",
    fontWeight: 500,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLGT9Z1JlFd2JQEl8qw.woff2",
  },
  /* latin */
  {
    fontStyle: "normal",
    fontWeight: 500,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "normal",
    fontWeight: 600,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLEj6Z1JlFd2JQEl8qw.woff2",
  },
  /* latin */
  {
    fontStyle: "normal",
    fontWeight: 600,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "normal",
    fontWeight: 700,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1JlFd2JQEl8qw.woff2",
  },
  /* latin */
  {
    fontStyle: "normal",
    fontWeight: 700,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "normal",
    fontWeight: 800,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLDD4Z1JlFd2JQEl8qw.woff2",
  },
  /* latin */
  {
    fontStyle: "normal",
    fontWeight: 800,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLDD4Z1xlFd2JQEk.woff2",
  },
  /* latin-ext */
  {
    fontStyle: "normal",
    fontWeight: 900,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLBT5Z1JlFd2JQEl8qw.woff2",
  },
  /* latin */
  {
    fontStyle: "normal",
    fontWeight: 900,
    src: "https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLBT5Z1xlFd2JQEk.woff2",
  },
];

export const PoppinsFont = () => (
  <>
    {poppins.map((font, index) => (
      <Font
        key={index}
        fontFamily="Poppins"
        fallbackFontFamily="Verdana"
        webFont={{
          url: font.src,
          format: "woff2",
        }}
        fontWeight={font.fontWeight}
        fontStyle={font.fontStyle}
      />
    ))}
  </>
);

export const RobotoFont = () => (
  <>
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
  </>
);
